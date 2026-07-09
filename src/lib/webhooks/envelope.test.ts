import { describe, expect, it } from "vitest";
import {
  buildEnvelope,
  envelopeSchema,
  type EnvelopeActor,
  type EnvelopeSubject,
} from "./envelope";

const actor: EnvelopeActor = { kind: "user", name: "Ada", ref: "user_123" };
const subject: EnvelopeSubject = {
  kind: "moment",
  ref: "moment_456",
  url: "https://tending.network/moments/456",
};

function makeEnvelope() {
  return buildEnvelope({
    event: "moment.created",
    organisationId: "org_1",
    tenantId: "tenant_1",
    actor,
    subject,
    data: { note: "hello" },
  });
}

describe("buildEnvelope", () => {
  it("produces an object that envelopeSchema accepts", () => {
    const envelope = makeEnvelope();
    const result = envelopeSchema.safeParse(envelope);
    expect(result.success).toBe(true);
  });

  it("sets the fixed sourceApp, schemaVersion, and tenant shape", () => {
    const envelope = makeEnvelope();
    expect(envelope.sourceApp).toBe("tending");
    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.tenant).toEqual({ app: "tending", id: "tenant_1" });
  });

  it("carries through actor, subject, and data", () => {
    const envelope = makeEnvelope();
    expect(envelope.event).toBe("moment.created");
    expect(envelope.actor).toEqual(actor);
    expect(envelope.subject).toEqual(subject);
    expect(envelope.data).toEqual({ note: "hello" });
  });

  it("generates an id and an ISO occurredAt timestamp", () => {
    const envelope = makeEnvelope();
    expect(typeof envelope.id).toBe("string");
    expect(envelope.id.length).toBeGreaterThan(0);
    expect(() => new Date(envelope.occurredAt).toISOString()).not.toThrow();
    expect(envelope.occurredAt).toBe(new Date(envelope.occurredAt).toISOString());
  });
});

describe("envelopeSchema", () => {
  it("rejects an unknown event name", () => {
    const envelope = { ...makeEnvelope(), event: "bogus.event" };
    expect(envelopeSchema.safeParse(envelope).success).toBe(false);
  });

  it("rejects a non-1 schemaVersion", () => {
    const envelope = { ...makeEnvelope(), schemaVersion: 2 };
    expect(envelopeSchema.safeParse(envelope).success).toBe(false);
  });

  it("rejects a non-tending sourceApp", () => {
    const envelope = { ...makeEnvelope(), sourceApp: "other" };
    expect(envelopeSchema.safeParse(envelope).success).toBe(false);
  });

  it("rejects a non-tending tenant.app", () => {
    const base = makeEnvelope();
    const envelope = { ...base, tenant: { ...base.tenant, app: "other" } };
    expect(envelopeSchema.safeParse(envelope).success).toBe(false);
  });
});
