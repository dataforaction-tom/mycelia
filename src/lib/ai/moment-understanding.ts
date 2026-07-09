import { z } from "zod/v3";
import { SPECTRUM_KEYS } from "@/lib/config/qualities";
import { runAiObjectTask } from "./run-object-task";
import { qualitySignalSchema, clampQualitySignals } from "./quality-signal";

const entityMentionSchema = z.object({
  name: z.string(),
  connectionId: z.string().uuid().nullable(),
});

export const momentUnderstandingSchema = z.object({
  entities: z.array(entityMentionSchema),
  qualitySignals: z.array(qualitySignalSchema),
  eventDate: z.coerce.date().nullable(),
  // A natural-language follow-up the user would want reminding about, e.g.
  // "check in about the National Lottery fund". Null when nothing in the text
  // implies a future action. No .min/.max here — Anthropic's structured-output
  // API rejects numeric bounds; the same rule applies to string constraints,
  // so keep the schema unconstrained and describe intent via .describe().
  followUp: z
    .object({
      note: z
        .string()
        .describe(
          "short, friendly nudge phrased as an action, e.g. 'check in about the National Lottery fund'",
        ),
      dueDate: z.coerce
        .date()
        .describe(
          "ISO 8601 date to be reminded — ideally shortly before the event or deadline so the nudge is actionable",
        ),
    })
    .nullable(),
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
4. If the moment implies a future action, commitment, or event the user
   would want to follow up on (e.g. "the fund opens again next week", "she'll
   send it Monday", "chase this in a fortnight"), set "followUp" with a short
   note describing what to check in about and a "dueDate" (ISO 8601) for when
   to be reminded — ideally shortly before the event/deadline. Set it to null
   when nothing in the text implies a follow-up; never invent one.

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
  const result = await runAiObjectTask(
    "moment-understanding",
    buildPrompt(content, existingConnections),
    momentUnderstandingSchema
  );
  return {
    ...result,
    qualitySignals: clampQualitySignals(result.qualitySignals),
  };
}
