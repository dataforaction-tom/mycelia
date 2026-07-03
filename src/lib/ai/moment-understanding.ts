import { z } from "zod/v3";
import { SPECTRUM_KEYS } from "@/lib/config/qualities";
import { runAiObjectTask } from "./run-object-task";

const entityMentionSchema = z.object({
  name: z.string(),
  connectionId: z.string().uuid().nullable(),
});

const qualitySignalSchema = z.object({
  connectionId: z.string().uuid(),
  spectrum: z.enum(SPECTRUM_KEYS as [string, ...string[]]),
  position: z.number().min(-1).max(1),
  confidence: z.number().min(0).max(1),
});

export const momentUnderstandingSchema = z.object({
  entities: z.array(entityMentionSchema),
  qualitySignals: z.array(qualitySignalSchema),
  eventDate: z.coerce.date().nullable(),
});

export type MomentUnderstanding = z.infer<typeof momentUnderstandingSchema>;

interface ExistingConnection {
  id: string;
  name: string;
  type: string;
}

function buildPrompt(
  content: string,
  existingConnections: ExistingConnection[]
): string {
  const roster =
    existingConnections.map((c) => `- ${c.name} (${c.type}), id: ${c.id}`).join("\n") ||
    "(none yet)";

  return `You are helping a user log a "moment" — a short note about an interaction
with someone in their network. Read the moment below and:

1. Extract every person, organisation, or group mentioned by name. For each,
   check the existing connections roster and set "connectionId" to the
   matching connection's id if it clearly refers to the same entity, or
   null if it does not match anyone on the roster (a new person/org not
   yet tracked).
2. For entities that DID match an existing connection (connectionId is not
   null), infer 0 or more quality signals: a spectrum key (one of
   ${SPECTRUM_KEYS.join(", ")}), a position from -1 to 1 along that
   spectrum, and your confidence (0 to 1) that this signal is well-supported
   by the text. Only suggest a signal when the language clearly implies it —
   do not guess. Never emit a quality signal for an entity with connectionId
   null.
3. If the text implies a specific date/time the described event happened
   (as opposed to today, when it is being recorded), set "eventDate" to
   that date (ISO 8601). Otherwise set it to null. Do not assume the event
   date is today only because none is stated.

Existing connections roster:
${roster}

Moment text:
"""
${content}
"""`;
}

export async function understandMoment(
  content: string,
  existingConnections: ExistingConnection[]
): Promise<MomentUnderstanding> {
  return runAiObjectTask(
    "moment-understanding",
    buildPrompt(content, existingConnections),
    momentUnderstandingSchema
  );
}
