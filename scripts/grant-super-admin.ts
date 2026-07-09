/**
 * Bootstrap the first platform admin. There is no UI to grant super_admin
 * (that would be a chicken-and-egg), so run this once against the target DB:
 *
 *   DATABASE_URL="postgres://…" npx tsx scripts/grant-super-admin.ts you@example.com
 *
 * NOTE: locally, .env.local points at the LIVE production Neon DB and Drizzle
 * tooling does not auto-load it — pass DATABASE_URL explicitly. The change
 * takes effect without re-login because the JWT refreshes platformRole from
 * the DB on every request.
 */
import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { users } from "../src/lib/db/schema";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/grant-super-admin.ts <email>");
    process.exit(1);
  }

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ platformRole: "super_admin", updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({
      id: users.id,
      email: users.email,
      platformRole: users.platformRole,
    });

  if (!updated) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`✓ Granted super_admin to ${updated.email} (${updated.id})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
