import { describe, expect, it } from "vitest";
import { isReservedSlug } from "./reserved-slugs";
import { updateOrganisationSchema } from "@/lib/validators/organisations";

describe("isReservedSlug", () => {
  it("reserves top-level route slugs", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("api")).toBe(true);
    expect(isReservedSlug("pricing")).toBe(true);
    expect(isReservedSlug("sign-in")).toBe(true);
  });

  it("allows ordinary slugs", () => {
    expect(isReservedSlug("acme")).toBe(false);
    expect(isReservedSlug("good-ship")).toBe(false);
  });
});

describe("updateOrganisationSchema slug", () => {
  it("rejects a reserved slug", () => {
    const result = updateOrganisationSchema.safeParse({ slug: "admin" });
    expect(result.success).toBe(false);
  });

  it("accepts a normal slug", () => {
    const result = updateOrganisationSchema.safeParse({ slug: "acme" });
    expect(result.success).toBe(true);
  });
});
