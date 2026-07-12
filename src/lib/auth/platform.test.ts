import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";

// Mock the auth() session accessor so requireSuperAdmin can be exercised.
const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));

import { isSuperAdmin, requireSuperAdmin } from "./platform";

function sessionWithRole(role: "super_admin" | "user"): Session {
  return {
    user: { id: "u1", email: "a@b.com", platformRole: role },
    expires: "2099-01-01",
  } as unknown as Session;
}

describe("isSuperAdmin", () => {
  it("is true only for the super_admin platform role", () => {
    expect(isSuperAdmin(sessionWithRole("super_admin"))).toBe(true);
  });

  it("is false for a normal user", () => {
    expect(isSuperAdmin(sessionWithRole("user"))).toBe(false);
  });

  it("is false when there is no session", () => {
    expect(isSuperAdmin(null)).toBe(false);
  });
});

describe("requireSuperAdmin", () => {
  beforeEach(() => authMock.mockReset());

  it("returns the user for a super_admin", async () => {
    authMock.mockResolvedValue(sessionWithRole("super_admin"));
    const user = await requireSuperAdmin();
    expect(user.platformRole).toBe("super_admin");
  });

  it("throws Forbidden for a normal user", async () => {
    authMock.mockResolvedValue(sessionWithRole("user"));
    await expect(requireSuperAdmin()).rejects.toThrow("Forbidden");
  });

  it("throws Forbidden when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireSuperAdmin()).rejects.toThrow("Forbidden");
  });
});
