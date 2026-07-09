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

  it("prunes observation references to connections outside the scope", () => {
    // An observation referencing the target plus a connection that shares no
    // moment with it — the outsider must not leak in, and must not remain a
    // dangling reference on the observation.
    const withOutsider = sampleExport();
    const focus = withOutsider.connections[0].id;
    const outsiderId = "00000000-0000-0000-0000-0000000000c9";
    withOutsider.connections.push({
      ...withOutsider.connections[1],
      id: outsiderId,
      name: "Outsider",
    });
    withOutsider.observations[0].connections = [focus, outsiderId];

    const result = scopeToConnection(withOutsider, focus);

    expect(result.connections.map((c) => c.id)).not.toContain(outsiderId);
    const observation = result.observations.find(
      (o) => o.id === withOutsider.observations[0].id,
    )!;
    expect(observation.connections).toContain(focus);
    expect(observation.connections).not.toContain(outsiderId);
  });
});
