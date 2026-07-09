import { db } from "@/lib/db";
import {
  connections,
  networkLinks,
  qualities,
  moments,
  momentConnections,
  observations,
} from "@/lib/db/schema";
import { and, eq, max, asc, inArray } from "drizzle-orm";
import {
  findArticulationPoints,
  findDependencyRisks,
} from "@/lib/network/dependencies";
import { detectQualityShifts } from "@/lib/network/quality-shifts";
import { QUALITY_SPECTRUMS } from "@/lib/config/qualities";
import { emitEvent } from "@/lib/webhooks/emit";
import { observationGeneratedPayload } from "@/lib/webhooks/payloads";

const DORMANT_THRESHOLD_MS = 8 * 7 * 24 * 60 * 60 * 1000; // 8 weeks

interface NewObservation {
  type: "dormant" | "dependency" | "bridge_risk" | "quality_shift";
  content: string;
  connectionIds: string[];
}

async function alreadyExists(
  organisationId: string,
  type: NewObservation["type"],
  connectionIds: string[]
): Promise<boolean> {
  const existing = await db
    .select({ id: observations.id, connections: observations.connections })
    .from(observations)
    .where(
      and(
        eq(observations.organisationId, organisationId),
        eq(observations.type, type),
        eq(observations.status, "new")
      )
    );

  const sortedTarget = [...connectionIds].sort().join(",");
  return existing.some(
    (row) => [...row.connections].sort().join(",") === sortedTarget
  );
}

export async function generateObservations(
  organisationId: string
): Promise<{ created: number }> {
  const pending: NewObservation[] = [];

  // --- Dormant connections ---
  const allConnections = await db
    .select({ id: connections.id, name: connections.name })
    .from(connections)
    .where(eq(connections.organisationId, organisationId));

  const lastMomentByConnection = await db
    .select({
      connectionId: momentConnections.connectionId,
      lastMomentDate: max(moments.createdAt),
    })
    .from(momentConnections)
    .innerJoin(moments, eq(momentConnections.momentId, moments.id))
    .innerJoin(connections, eq(connections.id, momentConnections.connectionId))
    .where(eq(connections.organisationId, organisationId))
    .groupBy(momentConnections.connectionId);

  const lastMomentMap = new Map(
    lastMomentByConnection.map((row) => [row.connectionId, row.lastMomentDate])
  );

  const now = Date.now();
  for (const connection of allConnections) {
    const lastMoment = lastMomentMap.get(connection.id);
    const isDormant =
      !lastMoment || now - lastMoment.getTime() > DORMANT_THRESHOLD_MS;

    if (isDormant) {
      const weeks = lastMoment
        ? Math.floor((now - lastMoment.getTime()) / (7 * 24 * 60 * 60 * 1000))
        : null;
      pending.push({
        type: "dormant",
        content: weeks
          ? `You haven't recorded any moments with ${connection.name} in ${weeks} weeks.`
          : `You haven't recorded any moments with ${connection.name} yet.`,
        connectionIds: [connection.id],
      });
    }
  }

  // --- Quality shifts ---
  const qualityRows = await db
    .select({
      connectionId: qualities.connectionId,
      spectrum: qualities.spectrum,
      position: qualities.position,
      createdAt: qualities.createdAt,
    })
    .from(qualities)
    .innerJoin(connections, eq(connections.id, qualities.connectionId))
    .where(eq(connections.organisationId, organisationId))
    .orderBy(asc(qualities.createdAt));

  const shifts = detectQualityShifts(qualityRows);
  if (shifts.length) {
    const shiftedConnectionIds = [...new Set(shifts.map((s) => s.connectionId))];
    const shiftedConnections = await db
      .select({ id: connections.id, name: connections.name })
      .from(connections)
      .where(inArray(connections.id, shiftedConnectionIds));
    const nameById = new Map(shiftedConnections.map((c) => [c.id, c.name]));

    for (const shift of shifts) {
      const config =
        QUALITY_SPECTRUMS[shift.spectrum as keyof typeof QUALITY_SPECTRUMS];
      const direction = shift.delta > 0 ? config.high : config.low;
      pending.push({
        type: "quality_shift",
        content: `${nameById.get(shift.connectionId) ?? "A connection"}'s ${config.label.toLowerCase()} has been shifting toward "${direction}."`,
        connectionIds: [shift.connectionId],
      });
    }
  }

  // --- Dependency / bridge risk ---
  const links = await db
    .select({
      source: networkLinks.sourceConnectionId,
      target: networkLinks.targetConnectionId,
      strength: networkLinks.strength,
    })
    .from(networkLinks)
    .where(eq(networkLinks.organisationId, organisationId));

  if (links.length) {
    const articulationPoints = findArticulationPoints(allConnections, links);
    const risks = findDependencyRisks(allConnections, links, articulationPoints);

    if (risks.length) {
      const riskConnections = await db
        .select({ id: connections.id, name: connections.name })
        .from(connections)
        .where(inArray(connections.id, risks.map((r) => r.connectionId)));
      const nameById = new Map(riskConnections.map((c) => [c.id, c.name]));

      for (const risk of risks) {
        pending.push({
          type: "dependency",
          content: `${risk.strongNeighbourCount} of your strongest relationships are all connected through ${nameById.get(risk.connectionId) ?? "one connection"} — what happens if that relationship changes?`,
          connectionIds: [risk.connectionId],
        });
      }
    }
  }

  // --- Insert, skipping duplicates of existing "new" observations ---
  let created = 0;
  for (const observation of pending) {
    const exists = await alreadyExists(
      organisationId,
      observation.type,
      observation.connectionIds
    );
    if (exists) continue;

    const [inserted] = await db
      .insert(observations)
      .values({
        organisationId,
        type: observation.type,
        content: observation.content,
        connections: observation.connectionIds,
      })
      .returning();
    created++;

    // Best-effort — emit an outbound webhook for subscribers. Its own
    // try/catch so a webhook failure (or absent subscribers) never breaks
    // observation generation.
    try {
      await emitEvent(organisationId, "observation.generated", {
        actor: { kind: "ai" },
        ...observationGeneratedPayload({
          observationId: inserted.id,
          content: inserted.content,
          observationType: inserted.type,
        }),
      });
    } catch (webhookError) {
      console.error(
        "Failed to emit observation.generated webhook",
        inserted.id,
        webhookError
      );
    }
  }

  return { created };
}
