import { describe, it, expect } from "vitest";
import { scopeToConnection } from "./collect-connection";
import { sampleExport } from "./sample.fixture";

describe("scopeToConnection", () => {
  const data = sampleExport();
  const target = data.connections[0].id;
  const coLinked = data.connections[1].id;
  const sharedMomentId = data.momentConnections.find(
    (mc) => mc.connectionId === coLinked,
  )!.momentId;
  const scoped = scopeToConnection(data, target);

  it("keeps the target and any connection sharing a moment with it", () => {
    const ids = scoped.connections.map((c) => c.id);
    expect(ids).toContain(target);
    expect(ids).toContain(coLinked);
  });
  it("keeps the shared moment and its links", () => {
    expect(scoped.moments.map((m) => m.id)).toContain(sharedMomentId);
    expect(scoped.momentConnections.some((mc) => mc.momentId === sharedMomentId)).toBe(true);
  });
  it("preserves org + members", () => {
    expect(scoped.organisation.slug).toBe("acme");
    expect(scoped.members).toEqual(data.members);
  });
});
