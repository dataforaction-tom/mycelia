import { db } from "@/lib/db";
import {
  connections,
  spaces,
  connectionSpaces,
  moments,
  momentConnections,
  networkLinks,
  qualities,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Seeds a new organisation with a small, believable demo world so the first
 * dashboard a user sees is alive: a deepening relationship, a cooling
 * funder, a dormant thread, clusters, spaces and a written story. Dates are
 * backdated so vitality, dormancy detection and quality shifts all have
 * something real to show.
 *
 * Returns the created ids — stored on organisations.settings.demo so
 * "clear demo data" can remove exactly these rows and nothing else.
 */

export interface DemoSeedResult {
  connectionIds: string[];
  spaceIds: string[];
  momentIds: string[];
  seededAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

const CONNECTION_DEFS: [name: string, type: "person" | "organisation" | "group" | "community"][] = [
  ["Sarah Jenkins", "person"],
  ["Priya Patel", "person"],
  ["James Okonkwo", "person"],
  ["Aisha Bello", "person"],
  ["Tom Reilly", "person"],
  ["Liam Fitzgerald", "person"],
  ["Park Road Community Centre", "organisation"],
  ["Northside Foundation", "organisation"],
  ["Winter Programme Volunteers", "group"],
  ["Riverside Estate", "community"],
];

const SPACE_DEFS: [name: string, description: string][] = [
  ["Winter Programme", "The winter support programme — where most threads cross"],
  ["Board Governance", "Trustees, policy and oversight"],
  ["Fundraising 2026", "Grants and funder relationships for the year"],
];

const SPACE_ASSIGNMENTS: [space: string, connection: string][] = [
  ["Winter Programme", "Sarah Jenkins"],
  ["Winter Programme", "Priya Patel"],
  ["Winter Programme", "Park Road Community Centre"],
  ["Winter Programme", "Winter Programme Volunteers"],
  ["Board Governance", "Tom Reilly"],
  ["Fundraising 2026", "James Okonkwo"],
  ["Fundraising 2026", "Northside Foundation"],
];

const MOMENT_DEFS: [content: string, daysAgo: number, connections: string[]][] = [
  ["Sarah introduced the winter programme concept to the board.", 100, ["Sarah Jenkins", "Tom Reilly"]],
  ["Coffee catch-up with Sarah about community needs.", 95, ["Sarah Jenkins"]],
  ["Sarah connected us with Priya to help coordinate volunteers.", 90, ["Sarah Jenkins", "Priya Patel"]],
  ["Priya organised the first volunteer meetup at the community centre.", 85, ["Priya Patel", "Park Road Community Centre"]],
  ["Sarah and the community centre team ran a joint outreach session.", 80, ["Sarah Jenkins", "Park Road Community Centre"]],
  ["Another planning session with Sarah and the community centre.", 70, ["Sarah Jenkins", "Park Road Community Centre"]],
  ["Sarah introduced Aisha from Riverside Estate to widen our reach.", 60, ["Sarah Jenkins", "Aisha Bello"]],
  ["Aisha shared updates on the Riverside Estate community needs.", 55, ["Aisha Bello", "Riverside Estate"]],
  ["Follow-up with Sarah and Aisha about cross-community collaboration.", 50, ["Sarah Jenkins", "Aisha Bello"]],
  ["Priya and the volunteers group finalised the winter rota.", 45, ["Priya Patel", "Winter Programme Volunteers"]],
  ["Board meeting with Tom Reilly to review governance policy.", 40, ["Tom Reilly"]],
  ["Tom Reilly reviewed the fundraising strategy at governance meeting.", 30, ["Tom Reilly"]],
  ["James mentioned Northside Foundation is reconsidering multi-year funding.", 15, ["James Okonkwo", "Northside Foundation"]],
  ["Had a great coffee with Sarah, she's really energised about the new outreach plan.", 10, ["Sarah Jenkins"]],
  ["Sarah and Priya ran a joint session with the community centre, brilliant turnout.", 5, ["Sarah Jenkins", "Priya Patel", "Park Road Community Centre"]],
  ["Quick check-in with Sarah about next steps.", 2, ["Sarah Jenkins"]],
  ["First and only conversation with Liam about a potential partnership.", 75, ["Liam Fitzgerald"]],
  ["James from Northside Foundation confirmed this year's grant.", 110, ["James Okonkwo", "Northside Foundation"]],
  ["Sent Northside Foundation our quarterly report, no response yet.", 70, ["James Okonkwo", "Northside Foundation"]],
  ["Chased Northside Foundation for feedback on the report, still no reply.", 20, ["James Okonkwo", "Northside Foundation"]],
];

const SARAH_STORY =
  "Sarah first appeared on our radar helping frame the winter programme, and quickly became one of our most engaged community connections. She brought Priya in to coordinate volunteers, ran joint sessions with the community centre, and more recently introduced Aisha from Riverside Estate — opening up a whole new part of the community. The relationship has deepened steadily and shows no signs of slowing.";

export async function seedDemoData(
  organisationId: string,
  authorUserId: string,
): Promise<DemoSeedResult> {
  // Connections
  const connectionRows = await db
    .insert(connections)
    .values(
      CONNECTION_DEFS.map(([name, type]) => ({
        organisationId,
        name,
        type,
        createdAt: daysAgo(120),
        updatedAt: daysAgo(1),
      })),
    )
    .returning({ id: connections.id, name: connections.name });
  const connByName = new Map(connectionRows.map((r) => [r.name, r.id]));

  // Spaces
  const spaceRows = await db
    .insert(spaces)
    .values(
      SPACE_DEFS.map(([name, description]) => ({
        organisationId,
        name,
        description,
      })),
    )
    .returning({ id: spaces.id, name: spaces.name });
  const spaceByName = new Map(spaceRows.map((r) => [r.name, r.id]));

  await db.insert(connectionSpaces).values(
    SPACE_ASSIGNMENTS.map(([spaceName, connName]) => ({
      connectionId: connByName.get(connName)!,
      spaceId: spaceByName.get(spaceName)!,
    })),
  );

  // Moments + links; co-mention counts drive network strengths
  const momentIds: string[] = [];
  const pairCounts = new Map<string, number>();

  for (const [content, days, names] of MOMENT_DEFS) {
    const [moment] = await db
      .insert(moments)
      .values({
        organisationId,
        authorId: authorUserId,
        content,
        source: "manual",
        createdAt: daysAgo(days),
      })
      .returning({ id: moments.id });
    momentIds.push(moment.id);

    const ids = names.map((n) => connByName.get(n)!);
    await db
      .insert(momentConnections)
      .values(ids.map((connectionId) => ({ momentId: moment.id, connectionId })));

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const [a, b] = ids[i] < ids[j] ? [ids[i], ids[j]] : [ids[j], ids[i]];
        const key = `${a}::${b}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  if (pairCounts.size > 0) {
    await db.insert(networkLinks).values(
      [...pairCounts.entries()].map(([key, count]) => {
        const [a, b] = key.split("::");
        return {
          organisationId,
          sourceConnectionId: a,
          targetConnectionId: b,
          strength: Math.min(0.5 + 0.1 * (count - 1), 1.0),
          source: "inferred" as const,
        };
      }),
    );
  }

  // Quality history: Sarah deepening, the funder cooling
  await db.insert(qualities).values([
    ...[
      [0.3, 90],
      [0.6, 50],
      [0.9, 10],
    ].map(([position, days]) => ({
      connectionId: connByName.get("Sarah Jenkins")!,
      spectrum: "depth",
      position,
      confidence: 0.7,
      source: "manual" as const,
      createdAt: daysAgo(days),
    })),
    ...[
      [0.5, 110],
      [0.0, 70],
      [-0.6, 15],
    ].map(([position, days]) => ({
      connectionId: connByName.get("Northside Foundation")!,
      spectrum: "reciprocity",
      position,
      confidence: 0.7,
      source: "manual" as const,
      createdAt: daysAgo(days),
    })),
  ]);

  // One written story; the rest stay empty to show that state too
  await db
    .update(connections)
    .set({ threadSummary: SARAH_STORY, threadUpdatedAt: daysAgo(2) })
    .where(eq(connections.id, connByName.get("Sarah Jenkins")!));

  return {
    connectionIds: connectionRows.map((r) => r.id),
    spaceIds: spaceRows.map((r) => r.id),
    momentIds,
    seededAt: new Date().toISOString(),
  };
}
