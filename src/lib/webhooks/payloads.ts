import type { EnvelopeSubject } from "./envelope";

/**
 * Content-minimised payload builders for outbound webhooks. Subscribers get
 * just enough to act on an event without us leaking full narrative content, so
 * free-text fields are truncated and payloads carry names + refs, not records.
 */

/** Absolute URL into the app for a given path, safe when the base is unset. */
function appUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${path}`;
}

/**
 * Return `text` unchanged when within `max`, otherwise the first `max`
 * characters followed by an ellipsis. Keeps webhook payloads bounded.
 */
export function truncate(text: string, max = 500): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

/**
 * Build the content-minimised `data` and `subject` for a `moment.created`
 * event.
 */
export function momentCreatedPayload(input: {
  momentId: string;
  content: string;
  source: string;
  connectionNames: string[];
  spaceName: string | null;
}): { data: Record<string, unknown>; subject: EnvelopeSubject } {
  return {
    data: {
      content: truncate(input.content),
      connectionNames: input.connectionNames,
      spaceName: input.spaceName,
      source: input.source,
    },
    subject: {
      kind: "moment",
      ref: `tending:moment:${input.momentId}`,
      url: appUrl(`/moments`),
    },
  };
}
