import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("converts text to lowercase kebab-case", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses multiple spaces/dashes", () => {
    expect(slugify("hello   world")).toBe("hello-world");
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
    expect(slugify("-hello-world-")).toBe("hello-world");
  });

  it("handles organisation names", () => {
    expect(slugify("The Good Ship")).toBe("the-good-ship");
    expect(slugify("St. Mary's Church")).toBe("st-marys-church");
    expect(slugify("Byker Community Trust & Partners")).toBe(
      "byker-community-trust-partners"
    );
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});
