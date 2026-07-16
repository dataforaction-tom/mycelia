import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Prefer the dev database for local schema work (generate/push/studio) so
    // migrations never run against the live prod DB. Falls back to
    // DATABASE_URL when DEV_DATABASE_URL isn't provided.
    url: (process.env.DEV_DATABASE_URL || process.env.DATABASE_URL)!,
  },
});
