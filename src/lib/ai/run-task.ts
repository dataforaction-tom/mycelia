import { generateText } from "ai";
import { getOpenRouter, getOllama } from "./providers";
import { AI_TASK_MODELS, OLLAMA_FALLBACK_MODEL, type AiTask } from "./registry";
import { withFallback } from "./with-fallback";

/**
 * Run a prompt against the task's configured OpenRouter model, falling
 * back to the local Ollama model if OpenRouter is unreachable, misconfigured,
 * or errors.
 */
export async function runAiTask(task: AiTask, prompt: string): Promise<string> {
  const result = await withFallback(
    () => generateText({ model: getOpenRouter()(AI_TASK_MODELS[task]), prompt }),
    () => generateText({ model: getOllama()(OLLAMA_FALLBACK_MODEL), prompt })
  );

  return result.text;
}
