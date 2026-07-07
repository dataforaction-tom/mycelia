import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isTranscriptionConfigured, transcribeAudio } from "./transcription";

const audio = new Blob(["fake-audio-bytes"], { type: "audio/webm" });

function mockFetchOnce(status: number, body: unknown) {
  const mock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status }),
  );
  vi.stubGlobal("fetch", mock);
  return mock;
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("isTranscriptionConfigured", () => {
  it("is false with no keys", () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(isTranscriptionConfigured()).toBe(false);
  });

  it("is true with either key", () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "el-key");
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(isTranscriptionConfigured()).toBe(true);

    vi.stubEnv("ELEVENLABS_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "oa-key");
    expect(isTranscriptionConfigured()).toBe(true);
  });
});

describe("transcribeAudio", () => {
  it("throws a clear error with no provider configured", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    await expect(transcribeAudio(audio, "clip.webm")).rejects.toThrow(
      "No transcription provider configured",
    );
  });

  it("prefers ElevenLabs when both keys are set", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "el-key");
    vi.stubEnv("OPENAI_API_KEY", "oa-key");
    const fetchMock = mockFetchOnce(200, { text: " hello from scribe " });

    const text = await transcribeAudio(audio, "clip.webm");

    expect(text).toBe("hello from scribe");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("api.elevenlabs.io");
    expect(init.headers["xi-api-key"]).toBe("el-key");
  });

  it("falls back to Whisper when only OpenAI is configured", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "oa-key");
    const fetchMock = mockFetchOnce(200, { text: "hello from whisper" });

    const text = await transcribeAudio(audio, "clip.webm");

    expect(text).toBe("hello from whisper");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("api.openai.com");
    expect(init.headers.Authorization).toBe("Bearer oa-key");
  });

  it("surfaces provider errors with status and detail", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "el-key");
    mockFetchOnce(401, { detail: "invalid api key" });

    await expect(transcribeAudio(audio, "clip.webm")).rejects.toThrow(
      /ElevenLabs transcription failed \(401\)/,
    );
  });
});
