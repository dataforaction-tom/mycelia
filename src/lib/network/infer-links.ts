import { db } from "@/lib/db";
import { networkLinks } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { pairsFromConnectionIds } from "./strength";

const STRENGTH_INCREMENT = 0.1;
const MAX_STRENGTH = 1.0;

/**
 * For every unique pair among `connectionIds` (co-mentioned in one moment),
 * create or strengthen the corresponding network_link row.
 */
export async function strengthenLinksForMoment(
  organisationId: string,
  connectionIds: string[]
): Promise<void> {
  const pairs = pairsFromConnectionIds(connectionIds);

  for (const [sourceConnectionId, targetConnectionId] of pairs) {
    await db
      .insert(networkLinks)
      .values({
        organisationId,
        sourceConnectionId,
        targetConnectionId,
        strength: 0.5,
        source: "inferred",
      })
      .onConflictDoUpdate({
        target: [
          networkLinks.sourceConnectionId,
          networkLinks.targetConnectionId,
        ],
        set: {
          strength: sql`LEAST(${networkLinks.strength} + ${STRENGTH_INCREMENT}, ${MAX_STRENGTH})`,
        },
      });
  }
}
