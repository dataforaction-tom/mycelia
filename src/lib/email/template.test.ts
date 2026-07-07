import { describe, it, expect } from "vitest";
import { renderEmail } from "./template";

describe("renderEmail", () => {
  const input = {
    preheader: "A preview line",
    heading: "Step inside",
    paragraphs: ["First paragraph.", "Second <paragraph> & things."],
    cta: { label: "Sign in", url: "https://tending.network/sign-in" },
    footerNote: "Expires in 24 hours.",
  };

  it("includes heading, preheader, cta and footer note in the html", () => {
    const { html } = renderEmail(input);
    expect(html).toContain("Step inside");
    expect(html).toContain("A preview line");
    expect(html).toContain("https://tending.network/sign-in");
    expect(html).toContain("Sign in");
    expect(html).toContain("Expires in 24 hours.");
    expect(html).toContain("tending");
  });

  it("escapes html in user-visible copy", () => {
    const { html } = renderEmail(input);
    expect(html).toContain("Second &lt;paragraph&gt; &amp; things.");
    expect(html).not.toContain("Second <paragraph>");
  });

  it("produces a complete text alternative", () => {
    const { text } = renderEmail(input);
    expect(text).toContain("Step inside");
    expect(text).toContain("First paragraph.");
    expect(text).toContain("Sign in: https://tending.network/sign-in");
    expect(text).toContain("tending.network");
  });

  it("renders without a cta or footer note", () => {
    const { html, text } = renderEmail({
      preheader: "p",
      heading: "h",
      paragraphs: ["body"],
    });
    expect(html).toContain("body");
    expect(text).toContain("body");
  });
});
