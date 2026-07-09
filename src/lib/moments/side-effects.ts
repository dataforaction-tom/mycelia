import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  moments,
  momentConnections,
  connections,
  qualities,
  spaces,
} from "@/lib/db/schema";
import { strengthenLinksForMoment } from "@/lib/network/infer-links";
import { inferQualitiesForMoment } from "@/lib/ai/quality-inference";
import { synthesizeThread } from "@/lib/ai/thread-synthesis";
import { emitEvent } from "@/lib/webhooks/emit";
import {
  momentCreatedPayload,
  qualityShiftedPayload,
} from "@/lib/webhooks/payloads";
import type { EnvelopeActor } from "@/lib/webhooks/envelope";

type MomentRow = typeof moments.$inferSelect;

/**
 * Apply the shared, source-agnostic side effects of creating a moment: link
 * connections, strengthen deterministic network links, and (best-effort)
 * infer qualities, synthesise threads, and emit the `moment.created` webhook.
 *
 * Called by both the session route (`/api/moments`) and the API-key route
 * (`/api/v1/moments`) so the two stay in lockstep. The only variation between
 * callers is `actor` — a user for session writes, a system/API-key actor for
 * integration writes.
 *
 * Failure semantics mirror the original session route exactly:
 * - `strengthenLinksForMoment` is deterministic with no external dependency,
 *   so it is allowed to throw and fail the whole request like any DB write.
 * - Quality inference, thread synthesis, and webhook emission each get their
 *   own try/catch and must NEVER fail moment creation.
 */
export async function applyMomentSideEffects({
  organisationId,
  moment,
  connectionIds,
  actor,
}: {
  organisationId: string;
  moment: MomentRow;
  connectionIds: string[];
  actor: EnvelopeActor;
}): Promise<void> {
  // Link connections if provided
  if (connectionIds.length) {
    await db.insert(momentConnections).values(
      connectionIds.map((connectionId) => ({
        momentId: moment.id,
        connectionId,
      }))
    );

    // Deterministic, no external dependency — allowed to fail the
    // whole request like any other DB write.
    if (connectionIds.length >= 2) {
      await strengthenLinksForMoment(organisationId, connectionIds);
    }

    // Best-effort — depends on an optional external AI service that
    // predictably has no credentials in many dev/test environments,
    // so it gets its own try/catch and must never fail moment creation.
    try {
      const linkedConnections = await db
        .select({ id: connections.id, name: connections.name })
        .from(connections)
        .where(inArray(connections.id, connectionIds));

      const { qualitySignals } = await inferQualitiesForMoment(
        moment.content,
        linkedConnections
      );

      if (qualitySignals.length) {
        // Capture each signal's previous latest position for its
        // (connectionId, spectrum) BEFORE inserting the new inferred
        // qualities, so we can detect material shifts afterwards.
        const previousPositions = new Map<string, number>();
        for (const signal of qualitySignals) {
          const [prev] = await db
            .select({ position: qualities.position })
            .from(qualities)
            .where(
              and(
                eq(qualities.connectionId, signal.connectionId),
                eq(qualities.spectrum, signal.spectrum)
              )
            )
            .orderBy(desc(qualities.createdAt))
            .limit(1);
          if (prev) {
            previousPositions.set(
              `${signal.connectionId}:${signal.spectrum}`,
              prev.position
            );
          }
        }

        await db.insert(qualities).values(
          qualitySignals.map((s) => ({
            connectionId: s.connectionId,
            spectrum: s.spectrum,
            position: s.position,
            confidence: s.confidence,
            source: "inferred" as const,
            momentId: moment.id,
          }))
        );

        // Best-effort — emit quality.shifted for any material move
        // (> 0.3) against the connection's previous position for that
        // spectrum. A missing previous position means this is the first
        // reading, which isn't a shift.
        const nameById = new Map(linkedConnections.map((c) => [c.id, c.name]));
        for (const signal of qualitySignals) {
          const prevPosition = previousPositions.get(
            `${signal.connectionId}:${signal.spectrum}`
          );
          if (prevPosition === undefined) continue;
          if (Math.abs(signal.position - prevPosition) <= 0.3) continue;

          await emitEvent(organisationId, "quality.shifted", {
            actor: { kind: "ai" },
            ...qualityShiftedPayload({
              connectionId: signal.connectionId,
              connectionName:
                nameById.get(signal.connectionId) ?? "A connection",
              spectrum: signal.spectrum,
              from: prevPosition,
              to: signal.position,
            }),
          });
        }
      }
    } catch (aiError) {
      console.error("Quality inference failed for moment", moment.id, aiError);
    }

    // Best-effort, independent of the quality-inference call above —
    // one connection's thread-synthesis failure shouldn't skip
    // synthesis for the moment's other linked connections either.
    for (const connectionId of connectionIds) {
      try {
        const [connectionRow] = await db
          .select({
            name: connections.name,
            threadSummary: connections.threadSummary,
          })
          .from(connections)
          .where(eq(connections.id, connectionId))
          .limit(1);

        if (!connectionRow) continue;

        const recentMomentsDesc = await db
          .select({
            content: moments.content,
            eventDate: moments.eventDate,
            createdAt: moments.createdAt,
          })
          .from(momentConnections)
          .innerJoin(moments, eq(momentConnections.momentId, moments.id))
          .where(eq(momentConnections.connectionId, connectionId))
          .orderBy(desc(moments.createdAt))
          .limit(20);

        if (recentMomentsDesc.length < 2) continue;

        const threadSummary = await synthesizeThread(
          connectionRow.name,
          connectionRow.threadSummary,
          recentMomentsDesc.slice().reverse()
        );

        await db
          .update(connections)
          .set({ threadSummary, threadUpdatedAt: new Date() })
          .where(eq(connections.id, connectionId));
      } catch (aiError) {
        console.error(
          "Thread synthesis failed for connection",
          connectionId,
          aiError
        );
      }
    }
  }

  // Best-effort — emit an outbound webhook for subscribers. Its own
  // try/catch so a webhook failure (or absent subscribers) never breaks
  // moment creation.
  try {
    const connectionNames = connectionIds.length
      ? (
          await db
            .select({ name: connections.name })
            .from(connections)
            .where(inArray(connections.id, connectionIds))
        ).map((row) => row.name)
      : [];

    let spaceName: string | null = null;
    if (moment.spaceId) {
      const [space] = await db
        .select({ name: spaces.name })
        .from(spaces)
        .where(eq(spaces.id, moment.spaceId))
        .limit(1);
      spaceName = space?.name ?? null;
    }

    await emitEvent(organisationId, "moment.created", {
      actor,
      ...momentCreatedPayload({
        momentId: moment.id,
        content: moment.content,
        source: moment.source,
        connectionNames,
        spaceName,
      }),
    });
  } catch (webhookError) {
    console.error(
      "Failed to emit moment.created webhook",
      moment.id,
      webhookError
    );
  }
}
