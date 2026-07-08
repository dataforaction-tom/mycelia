import { z } from "zod/v3";
import { SPECTRUM_KEYS } from "@/lib/config/qualities";
import { runAiObjectTask } from "./run-object-task";
import { qualitySignalSchema, clampQualitySignals } from "./quality-signal";

export const qualityInferenceSchema = z.object({
  qualitySignals: z.array(qualitySignalSchema),
});

export type QualityInference = z.infer<typeof qualityInferenceSchema>;

interface LinkedConnection {
  id: string;
  name: string;
}

function buildPrompt(
  content: string,
  linkedConnections: LinkedConnection[]
): string {
  const roster = linkedConnections
    .map((c) => `- ${c.name}, id: ${c.id}`)
    .join("\n");

  return `You are analysing a "moment" — a short note about an interaction — to
infer relationship quality signals for the people/organisations already
confirmed as involved. Read the moment and, for each connection listed
below, infer 0 or more quality signals: a spectrum key (one of
${SPECTRUM_KEYS.join(", ")}), a position from -1 to 1 along that spectrum,
and your confidence (0 to 1) that this signal is well-supported by the
text. Only suggest a signal when the language clearly implies it — do not
guess. Only use connectionId values from the list below; never invent one.

Connections involved in this moment:
${roster}

Moment text:
"""
${content}
"""`;
}

export async function inferQualitiesForMoment(
  content: string,
  linkedConnections: LinkedConnection[]
): Promise<QualityInference> {
  const result = await runAiObjectTask(
    "quality-inference",
    buildPrompt(content, linkedConnections),
    qualityInferenceSchema
  );
  return {
    ...result,
    qualitySignals: clampQualitySignals(result.qualitySignals),
  };
}
