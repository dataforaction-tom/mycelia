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

/**
 * Build the content-minimised `data` and `subject` for a `connection.created`
 * event.
 */
export function connectionCreatedPayload(input: {
  connectionId: string;
  name: string;
  type: string;
}): { data: Record<string, unknown>; subject: EnvelopeSubject } {
  return {
    data: {
      name: input.name,
      type: input.type,
    },
    subject: {
      kind: "connection",
      ref: `tending:connection:${input.connectionId}`,
      url: appUrl(`/connections/${input.connectionId}`),
    },
  };
}

/**
 * Build the content-minimised `data` and `subject` for an
 * `observation.generated` event. Observation content is truncated since it can
 * carry narrative text.
 */
export function observationGeneratedPayload(input: {
  observationId: string;
  content: string;
  observationType: string;
}): { data: Record<string, unknown>; subject: EnvelopeSubject } {
  return {
    data: {
      content: truncate(input.content),
      observationType: input.observationType,
    },
    subject: {
      kind: "observation",
      ref: `tending:observation:${input.observationId}`,
      url: appUrl("/observations"),
    },
  };
}

/**
 * Build the content-minimised `data` and `subject` for a `quality.shifted`
 * event. Carries the spectrum and the previous/new positions so subscribers can
 * see the direction and size of the move.
 */
export function qualityShiftedPayload(input: {
  connectionId: string;
  connectionName: string;
  spectrum: string;
  from: number;
  to: number;
}): { data: Record<string, unknown>; subject: EnvelopeSubject } {
  return {
    data: {
      connectionName: input.connectionName,
      spectrum: input.spectrum,
      from: input.from,
      to: input.to,
    },
    subject: {
      kind: "quality",
      ref: `tending:connection:${input.connectionId}`,
      url: appUrl(`/connections/${input.connectionId}`),
    },
  };
}
