import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;
let _sql: NeonQueryFunction<false, false> | null = null;

/**
 * Resolve which database to connect to. Local dev points at a separate
 * database (DEV_DATABASE_URL) so schema pushes and experiments never touch the
 * live prod DB. Production doesn't set DEV_DATABASE_URL and would ignore it
 * regardless — the NODE_ENV gate ensures a stray DEV_DATABASE_URL in a prod
 * environment can never redirect production traffic to the dev database.
 */
function resolveDatabaseUrl(): string | undefined {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_DATABASE_URL) {
    return process.env.DEV_DATABASE_URL;
  }
  return process.env.DATABASE_URL;
}

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = resolveDatabaseUrl();
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    _sql = neon(url);
    _db = drizzle({ client: _sql, schema });
  }
  return _db;
}

// Proxy that lazily initialises the db on first property access at runtime.
// This lets modules import `db` without crashing at build time.
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop: string | symbol) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getDb() as any)[prop];
  },
});
