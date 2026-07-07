import { NextRequest } from "next/server";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import {
  isTranscriptionConfigured,
  transcribeAudio,
} from "@/lib/ai/transcription";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

/** Capability probe: lets the composer hide the mic when no provider is set. */
export async function GET(request: NextRequest) {
  try {
    const { membership } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse({ available: isTranscriptionConfigured() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { membership } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const form = await request.formData();
    const audio = form.get("audio");

    if (!(audio instanceof File)) {
      return errorResponse("Missing audio file", 422);
    }
    if (audio.size === 0) {
      return errorResponse("Empty audio file", 422);
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return errorResponse("Audio too large (max 15 MB)", 413);
    }
    if (audio.type && !audio.type.startsWith("audio/")) {
      return errorResponse("Unsupported file type", 422);
    }

    const text = await transcribeAudio(audio, audio.name || "moment.webm");

    return successResponse({ text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("No transcription provider")) {
      return errorResponse("Voice capture is not configured", 503);
    }
    if (msg.includes("transcription failed")) {
      return errorResponse("Transcription is unavailable right now", 502);
    }
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
