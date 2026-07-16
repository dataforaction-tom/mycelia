"use client";

import { useEffect, useRef, useState } from "react";

interface VoiceCaptureButtonProps {
  organisationId: string;
  onTranscript: (text: string) => void;
}

type CaptureState = "idle" | "recording" | "transcribing";

// One capability probe per org per page load — reopening the composer
// shouldn't re-ask the server whether a provider is configured.
const availabilityCache = new Map<string, Promise<boolean>>();

function probeAvailability(organisationId: string): Promise<boolean> {
  let cached = availabilityCache.get(organisationId);
  if (!cached) {
    cached = fetch("/api/moments/transcribe", {
      headers: { "x-organisation-id": organisationId },
    })
      .then(async (res) => (res.ok ? (await res.json()).data.available : false))
      .catch(() => false);
    availabilityCache.set(organisationId, cached);
  }
  return cached;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
    MediaRecorder.isTypeSupported(type)
  );
}

/**
 * Speak a moment: record → transcribe (ElevenLabs/Whisper via
 * /api/moments/transcribe) → hand the text to the composer, where entity
 * recognition takes over. Renders nothing when no provider is configured.
 */
export function VoiceCaptureButton({
  organisationId,
  onTranscript,
}: VoiceCaptureButtonProps) {
  const [available, setAvailable] = useState(false);
  const [state, setState] = useState<CaptureState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    probeAvailability(organisationId).then((ok) => {
      if (!cancelled) setAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [organisationId]);

  // Stop the mic if the modal unmounts mid-recording.
  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!available) return null;

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setSeconds(0);

        const blob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size === 0) {
          setState("idle");
          return;
        }

        setState("transcribing");
        try {
          const form = new FormData();
          const extension = blob.type.includes("mp4") ? "mp4" : "webm";
          form.append("audio", blob, `moment.${extension}`);
          const res = await fetch("/api/moments/transcribe", {
            method: "POST",
            headers: { "x-organisation-id": organisationId },
            body: form,
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? "Transcription failed");
          } else if (data.data.text) {
            onTranscript(data.data.text);
          } else {
            setError("Nothing heard — try again a little closer to the mic");
          }
        } catch {
          setError("Transcription failed");
        } finally {
          setState("idle");
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone unavailable — check browser permissions");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
      {state === "recording" && (
        <span className="text-terracotta-dark flex items-center gap-1.5 text-xs">
          <span className="animate-glow bg-terracotta h-2 w-2 rounded-full" />
          {seconds}s
        </span>
      )}
      {state === "transcribing" && (
        <span role="status" className="text-muted text-xs">
          Listening back…
        </span>
      )}
      <button
        type="button"
        onClick={state === "recording" ? stopRecording : startRecording}
        disabled={state === "transcribing"}
        aria-label={
          state === "recording" ? "Stop recording" : "Speak this moment"
        }
        title={state === "recording" ? "Stop recording" : "Speak this moment"}
        className={
          state === "recording"
            ? "bg-terracotta flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-[0_0_14px_rgba(201,123,71,0.5)] transition-all"
            : "border-border-strong text-bark-light hover:border-moss/50 hover:text-moss-dark flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition-all disabled:opacity-50"
        }
      >
        {state === "recording" ? (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <rect width="12" height="12" rx="2" fill="currentColor" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>
    </div>
  );
}
