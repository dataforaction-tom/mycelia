export type AiTask =
  | "moment-understanding"
  | "thread-synthesis"
  | "pattern-recognition"
  | "migration-conversation"
  | "quality-inference"
  | "quick-extraction";

/**
 * OpenRouter model per task, in OpenRouter's `provider/model` format.
 * Synthesis/understanding tasks get a stronger model; cheap/fast tasks
 * get a lighter one.
 */
export const AI_TASK_MODELS: Record<AiTask, string> = {
  "moment-understanding": "anthropic/claude-sonnet-4.5",
  "thread-synthesis": "anthropic/claude-sonnet-4.5",
  "pattern-recognition": "anthropic/claude-sonnet-4.5",
  "migration-conversation": "anthropic/claude-sonnet-4.5",
  "quality-inference": "google/gemini-2.5-flash",
  "quick-extraction": "google/gemini-2.5-flash",
};

/** Single shared local fallback model — whatever the user has pulled. */
export const OLLAMA_FALLBACK_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
