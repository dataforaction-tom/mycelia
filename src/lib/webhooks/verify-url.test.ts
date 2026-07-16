import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isSafeWebhookUrl } from "./verify-url";

const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnv(value: string | undefined) {
  // NODE_ENV is typed as readonly in some setups; assign via index to allow it.
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

afterEach(() => {
  setNodeEnv(originalNodeEnv);
});

describe("isSafeWebhookUrl", () => {
  it("accepts ordinary public https URLs", () => {
    expect(isSafeWebhookUrl("https://example.com/hook")).toBe(true);
    expect(isSafeWebhookUrl("https://hooks.zapier.com/x")).toBe(true);
  });

  it("rejects the cloud metadata IP", () => {
    expect(isSafeWebhookUrl("http://169.254.169.254/")).toBe(false);
    expect(isSafeWebhookUrl("https://169.254.169.254/latest/meta-data")).toBe(
      false
    );
  });

  it("rejects the 0.0.0.0/8 unspecified/loopback-routable range", () => {
    // 0.0.0.0 routes to loopback on Linux and is a classic SSRF bypass for
    // reaching services bound to localhost.
    expect(isSafeWebhookUrl("https://0.0.0.0/")).toBe(false);
    expect(isSafeWebhookUrl("http://0.0.0.0/")).toBe(false);
  });

  it("rejects IPv4-mapped IPv6 that reaches internal ranges", () => {
    // Node normalises ::ffff:a.b.c.d to a hex form (::ffff:hhhh:hhhh); the
    // embedded IPv4 must be run through the same private-range check.
    expect(isSafeWebhookUrl("https://[::ffff:169.254.169.254]/")).toBe(false);
    expect(isSafeWebhookUrl("https://[::ffff:127.0.0.1]/")).toBe(false);
    expect(isSafeWebhookUrl("https://[::ffff:10.0.0.1]/")).toBe(false);
  });

  it("rejects NAT64-embedded internal IPv4 (64:ff9b::/96)", () => {
    // NAT64 maps an IPv4 into the last 32 bits; reaching the metadata IP this
    // way must also be blocked.
    expect(isSafeWebhookUrl("https://[64:ff9b::a9fe:a9fe]/")).toBe(false);
  });

  it("rejects the IPv6 unspecified address", () => {
    expect(isSafeWebhookUrl("https://[::]/")).toBe(false);
  });

  it("keeps decimal/octal/hex IPv4 obfuscation closed", () => {
    // Node's URL parser normalises these to dotted-decimal (127.0.0.1) before
    // our check runs, so they are already rejected — documented here so the
    // vectors stay closed if that parsing behaviour ever changes.
    expect(isSafeWebhookUrl("https://2130706433/")).toBe(false);
    expect(isSafeWebhookUrl("https://0x7f000001/")).toBe(false);
  });

  it("rejects private IPv4 ranges", () => {
    expect(isSafeWebhookUrl("https://10.0.0.5/x")).toBe(false);
    expect(isSafeWebhookUrl("https://192.168.1.1")).toBe(false);
    expect(isSafeWebhookUrl("https://172.16.0.1")).toBe(false);
    expect(isSafeWebhookUrl("https://127.0.0.1/x")).toBe(false);
  });

  it("rejects IPv6 loopback and unique-local", () => {
    expect(isSafeWebhookUrl("https://[::1]/x")).toBe(false);
    expect(isSafeWebhookUrl("https://[fc00::1]/x")).toBe(false);
    expect(isSafeWebhookUrl("https://[fd12:3456::1]/x")).toBe(false);
  });

  it("rejects IPv6 link-local (fe80::/10) and multicast (ff00::/8)", () => {
    expect(isSafeWebhookUrl("https://[fe80::1]/x")).toBe(false);
    expect(isSafeWebhookUrl("https://[ff02::1]/x")).toBe(false);
  });

  it("does not mistake domains that start with fc/fd for unique-local IPv6", () => {
    // Regression: the fc00::/7 prefix test must only apply to IPv6 literals,
    // not to ordinary hostnames like fcbarcelona.com / fdny.example.
    expect(isSafeWebhookUrl("https://fcbarcelona.com/hook")).toBe(true);
    expect(isSafeWebhookUrl("https://fd-signal.example.com/hook")).toBe(true);
    expect(isSafeWebhookUrl("https://fe80.example.com/hook")).toBe(true);
  });

  it("rejects non-http(s) schemes", () => {
    expect(isSafeWebhookUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeWebhookUrl("ftp://example.com")).toBe(false);
    expect(isSafeWebhookUrl("gopher://example.com")).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isSafeWebhookUrl("not a url")).toBe(false);
    expect(isSafeWebhookUrl("")).toBe(false);
  });

  describe("in production", () => {
    beforeEach(() => setNodeEnv("production"));

    it("rejects localhost and http", () => {
      expect(isSafeWebhookUrl("https://localhost")).toBe(false);
      expect(isSafeWebhookUrl("http://localhost:3000")).toBe(false);
      expect(isSafeWebhookUrl("http://127.0.0.1:3000")).toBe(false);
    });

    it("rejects the GCP metadata hostname", () => {
      expect(isSafeWebhookUrl("https://metadata.google.internal/x")).toBe(
        false
      );
    });
  });

  describe("outside production", () => {
    beforeEach(() => setNodeEnv("development"));

    it("allows http to localhost and 127.0.0.1 for local dev", () => {
      expect(isSafeWebhookUrl("http://localhost:3000/hook")).toBe(true);
      expect(isSafeWebhookUrl("http://127.0.0.1:3000/hook")).toBe(true);
    });

    it("still rejects http to a public host", () => {
      expect(isSafeWebhookUrl("http://example.com")).toBe(false);
    });
  });
});
