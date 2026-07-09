import { randomBytes, createHash } from "node:crypto";

const PREFIX_LEN = 12;

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): {
  key: string;
  prefix: string;
  hashedKey: string;
} {
  const key = "tnd_live_" + randomBytes(24).toString("base64url");
  return { key, prefix: key.slice(0, PREFIX_LEN), hashedKey: hashApiKey(key) };
}
