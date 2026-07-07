/**
 * Speech-to-text for voice moments. One provider interface, two backends:
 * ElevenLabs Scribe (preferred when configured) or OpenAI Whisper — chosen
 * by which API key is present. Keys are read lazily at call time, never at
 * module level, per the project's build-safety rule. OpenRouter has no STT
 * endpoint, so this is deliberately separate from the chat-model registry.
 */

export function isTranscriptionConfigured(): boolean {
  return Boolean(
    process.env.ELEVENLABS_API_KEY || process.env.OPENAI_API_KEY,
  );
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return body.slice(0, 200);
  } catch {
    return "";
  }
}

async function transcribeWithElevenLabs(
  apiKey: string,
  audio: Blob,
  filename: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });

  if (!res.ok) {
    throw new Error(
      `ElevenLabs transcription failed (${res.status}): ${await readErrorDetail(res)}`,
    );
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

async function transcribeWithWhisper(
  apiKey: string,
  audio: Blob,
  filename: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(
      `Whisper transcription failed (${res.status}): ${await readErrorDetail(res)}`,
    );
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

export async function transcribeAudio(
  audio: Blob,
  filename: string,
): Promise<string> {
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  if (elevenLabsKey) {
    return transcribeWithElevenLabs(elevenLabsKey, audio, filename);
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return transcribeWithWhisper(openAiKey, audio, filename);
  }

  throw new Error("No transcription provider configured");
}
