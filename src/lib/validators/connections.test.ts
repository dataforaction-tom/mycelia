import { describe, it, expect } from "vitest";
import {
  contactDetailsSchema,
  normaliseContactDetails,
} from "./connections";

describe("normaliseContactDetails", () => {
  it("returns undefined when given nothing", () => {
    expect(normaliseContactDetails(undefined)).toBeUndefined();
  });

  it("strips blank and whitespace-only fields", () => {
    expect(
      normaliseContactDetails({
        email: "a@b.org",
        phone: "   ",
        website: "",
        location: "Bristol",
      })
    ).toEqual({ email: "a@b.org", location: "Bristol" });
  });

  it("returns undefined when every field is blank", () => {
    expect(
      normaliseContactDetails({ email: "", phone: "  ", website: "", location: "" })
    ).toBeUndefined();
  });

  it("trims surrounding whitespace on kept values", () => {
    expect(normaliseContactDetails({ phone: "  01179 " })).toEqual({
      phone: "01179",
    });
  });
});

describe("contactDetailsSchema", () => {
  it("accepts a valid email and empty siblings", () => {
    const result = contactDetailsSchema.safeParse({
      email: "hello@example.org",
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty email string (blank form field)", () => {
    expect(contactDetailsSchema.safeParse({ email: "" }).success).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(contactDetailsSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false
    );
  });
});
