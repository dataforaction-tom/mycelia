import { generateObject } from "ai";
import type { z } from "zod/v3";
import { getOpenRouter, getOllama } from "./providers";
import { AI_TASK_MODELS, OLLAMA_FALLBACK_MODEL, type AiTask } from "./registry";
import { withFallback } from "./with-fallback";

/**
 * Like runAiTask, but validates the response against a schema instead of
 * returning freeform text — falls back to Ollama if OpenRouter fails,
 * including when its response fails schema validation.
 */
export async function runAiObjectTask<T>(
  task: AiTask,
  prompt: string,
  schema: z.ZodType<T>
): Promise<T> {
  const result = await withFallback(
    () => generateObject({ model: getOpenRouter()(AI_TASK_MODELS[task]), prompt, schema }),
    () => generateObject({ model: getOllama()(OLLAMA_FALLBACK_MODEL), prompt, schema })
  );

  return result.object;
}
