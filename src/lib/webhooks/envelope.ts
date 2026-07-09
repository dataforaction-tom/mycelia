import { randomUUID } from "node:crypto";
import { z } from "zod/v3";

/**
 * The five outbound webhook event names. This union is the single source of
 * truth for what Tending can emit and is forward-compatible with the future
 * event spine (Watershed-shaped envelope).
 */
export type WebhookEventName =
  | "moment.created"
  | "connection.created"
  | "observation.generated"
  | "quality.shifted"
  | "follow_up.due";

const WEBHOOK_EVENT_NAMES = [
  "moment.created",
  "connection.created",
  "observation.generated",
  "quality.shifted",
  "follow_up.due",
] as const;

/** Who or what triggered the event. */
export interface EnvelopeActor {
  kind: "user" | "system" | "ai";
  name?: string;
  ref?: string;
}

/** The thing the event is about (e.g. a moment, a connection). */
export interface EnvelopeSubject {
  kind: string;
  ref: string;
  url?: string;
}

const actorSchema = z.object({
  kind: z.enum(["user", "system", "ai"]),
  name: z.string().optional(),
  ref: z.string().optional(),
});

const subjectSchema = z.object({
  kind: z.string(),
  ref: z.string(),
  url: z.string().optional(),
});

/**
 * Zod schema for the event envelope. Kept as the single source of truth for the
 * envelope shape; the `Envelope` type is inferred from it.
 */
export const envelopeSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  event: z.enum(WEBHOOK_EVENT_NAMES),
  occurredAt: z.string(),
  sourceApp: z.literal("tending"),
  tenant: z.object({
    app: z.literal("tending"),
    id: z.string(),
  }),
  actor: actorSchema,
  subject: subjectSchema,
  data: z.record(z.unknown()),
});

export type Envelope = z.infer<typeof envelopeSchema>;

/**
 * Build a Watershed-shaped event envelope. Pure aside from the generated `id`
 * and `occurredAt` timestamp — no DB or network access.
 */
export function buildEnvelope(input: {
  event: WebhookEventName;
  organisationId: string;
  tenantId: string;
  actor: EnvelopeActor;
  subject: EnvelopeSubject;
  data: Record<string, unknown>;
}): Envelope {
  return {
    id: randomUUID(),
    schemaVersion: 1,
    event: input.event,
    occurredAt: new Date().toISOString(),
    sourceApp: "tending",
    tenant: { app: "tending", id: input.tenantId },
    actor: input.actor,
    subject: input.subject,
    data: input.data,
  };
}
