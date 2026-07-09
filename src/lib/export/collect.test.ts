import { describe, it, expect } from "vitest";
import { EXPORTED_ENTITY_KEYS } from "./collect";

describe("collect coverage", () => {
  it("exports every org-owned entity we intend to (update deliberately when schema grows)", () => {
    expect([...EXPORTED_ENTITY_KEYS].sort()).toEqual(
      [
        "connections", "moments", "momentConnections", "spaces",
        "connectionSpaces", "qualities", "observations",
        "networkLinks", "members",
      ].sort(),
    );
  });
});
