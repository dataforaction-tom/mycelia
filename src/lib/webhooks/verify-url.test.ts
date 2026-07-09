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
    expect(isSafeWebhookUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
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
      expect(isSafeWebhookUrl("https://metadata.google.internal/x")).toBe(false);
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
