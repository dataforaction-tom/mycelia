import { z } from "zod/v3";
import { SPECTRUM_KEYS } from "@/lib/config/qualities";

/**
 * A single AI-inferred relationship quality signal, shared by every task that
 * asks a model to read a moment and infer where a relationship sits.
 *
 * Deliberately NO `.min()/.max()` on position/confidence: Anthropic's
 * structured-output API rejects `minimum`/`maximum` on numbers (returns 400,
 * which surfaced in prod as "Both providers failed" 502s). We convey the range
 * to the model via `.describe()` and guarantee it after generation with
 * clampQualitySignals instead.
 */
export const qualitySignalSchema = z.object({
  connectionId: z.string().uuid(),
  spectrum: z.enum(SPECTRUM_KEYS as [string, ...string[]]),
  position: z.number().describe("from -1 (low end) to 1 (high end)"),
  confidence: z.number().describe("from 0 (unsure) to 1 (certain)"),
});

export type QualitySignal = z.infer<typeof qualitySignalSchema>;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/**
 * Clamp model-returned signals into their valid ranges. The prompt asks for
 * position ∈ [-1, 1] and confidence ∈ [0, 1], but since we can't enforce that
 * in the JSON schema (see above), we clamp here rather than store — or reject —
 * an out-of-range value.
 */
export function clampQualitySignals<
  T extends { position: number; confidence: number },
>(signals: T[]): T[] {
  return signals.map((signal) => ({
    ...signal,
    position: clamp(signal.position, -1, 1),
    confidence: clamp(signal.confidence, 0, 1),
  }));
}
