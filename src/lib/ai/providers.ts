import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

let openrouter: ReturnType<typeof createOpenRouter> | null = null;

/**
 * Lazy OpenRouter client — never instantiated at module load so the app
 * can build/start without OPENROUTER_API_KEY set.
 */
export function getOpenRouter() {
  if (!openrouter) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }
    openrouter = createOpenRouter({ apiKey });
  }
  return openrouter;
}

let ollama: ReturnType<typeof createOpenAICompatible> | null = null;

/**
 * Lazy Ollama client via the OpenAI-compatible endpoint Ollama exposes —
 * no API key required, points at a local (or configured) Ollama instance.
 */
export function getOllama() {
  if (!ollama) {
    ollama = createOpenAICompatible({
      name: "ollama",
      baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
      apiKey: "ollama",
    });
  }
  return ollama;
}
