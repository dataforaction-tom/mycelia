import { describe, expect, it } from "vitest";
import { canPerform, hasMinRole, ORG_ROLE_HIERARCHY, PERMISSIONS } from "./permissions";

describe("hasMinRole", () => {
  it("owner has all roles", () => {
    expect(hasMinRole("owner", "owner")).toBe(true);
    expect(hasMinRole("owner", "admin")).toBe(true);
    expect(hasMinRole("owner", "contributor")).toBe(true);
    expect(hasMinRole("owner", "viewer")).toBe(true);
  });

  it("admin has admin and below", () => {
    expect(hasMinRole("admin", "owner")).toBe(false);
    expect(hasMinRole("admin", "admin")).toBe(true);
    expect(hasMinRole("admin", "contributor")).toBe(true);
    expect(hasMinRole("admin", "viewer")).toBe(true);
  });

  it("contributor has contributor and below", () => {
    expect(hasMinRole("contributor", "owner")).toBe(false);
    expect(hasMinRole("contributor", "admin")).toBe(false);
    expect(hasMinRole("contributor", "contributor")).toBe(true);
    expect(hasMinRole("contributor", "viewer")).toBe(true);
  });

  it("viewer only has viewer", () => {
    expect(hasMinRole("viewer", "owner")).toBe(false);
    expect(hasMinRole("viewer", "admin")).toBe(false);
    expect(hasMinRole("viewer", "contributor")).toBe(false);
    expect(hasMinRole("viewer", "viewer")).toBe(true);
  });

  it("returns false for invalid roles", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasMinRole("invalid" as any, "viewer")).toBe(false);
  });
});

describe("canPerform", () => {
  it("passes when the role alone satisfies the requirement, regardless of bitmask", () => {
    expect(
      canPerform({ role: "admin", permissions: 0 }, "DELETE_CONNECTIONS", "admin")
    ).toBe(true);
  });

  it("passes for a lower role with the matching bit set", () => {
    expect(
      canPerform(
        { role: "contributor", permissions: PERMISSIONS.DELETE_CONNECTIONS },
        "DELETE_CONNECTIONS",
        "admin"
      )
    ).toBe(true);
  });

  it("fails for a lower role without the matching bit", () => {
    expect(
      canPerform(
        { role: "contributor", permissions: PERMISSIONS.DELETE_MOMENTS },
        "DELETE_CONNECTIONS",
        "admin"
      )
    ).toBe(false);
  });

  it("resolves correctly when multiple bits are combined", () => {
    const combined = PERMISSIONS.DELETE_CONNECTIONS | PERMISSIONS.MANAGE_MEMBERS;
    expect(
      canPerform({ role: "viewer", permissions: combined }, "DELETE_CONNECTIONS", "admin")
    ).toBe(true);
    expect(
      canPerform({ role: "viewer", permissions: combined }, "MANAGE_MEMBERS", "admin")
    ).toBe(true);
    expect(
      canPerform({ role: "viewer", permissions: combined }, "DELETE_SPACES", "admin")
    ).toBe(false);
  });
});

describe("ORG_ROLE_HIERARCHY", () => {
  it("has 4 roles in correct order", () => {
    expect(ORG_ROLE_HIERARCHY).toEqual([
      "owner",
      "admin",
      "contributor",
      "viewer",
    ]);
  });
});
