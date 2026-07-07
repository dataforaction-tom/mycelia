// One-off dev seed script — inserts a rich demo organisation directly via
// SQL (bypassing the API) so moment/quality dates can be backdated to
// realistically demonstrate dormant detection, quality shifts, and network
// clustering. Run with: DATABASE_URL=... node scripts/seed-demo.js
//
// Not wired into any npm script or CI — purely a manual dev tool.
const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// The dev-login user already created earlier this session.
const OWNER_USER_ID = "bb2220be-8faa-447c-ae73-906e0fa25281";

const DAY_MS = 24 * 60 * 60 * 1000;
function daysAgo(n) {
  return new Date(Date.now() - n * DAY_MS);
}

async function main() {
  console.log("Creating organisation...");
  const trialEndsAt = new Date(Date.now() + 30 * DAY_MS);
  const [org] = await sql`
    INSERT INTO organisations (name, slug, plan, trial_ends_at)
    VALUES ('Seed Demo', 'seed-demo', 'trial', ${trialEndsAt})
    RETURNING id
  `;
  const orgId = org.id;
  console.log("  org id:", orgId);

  await sql`
    INSERT INTO organisation_memberships (user_id, organisation_id, role, accepted_at)
    VALUES (${OWNER_USER_ID}, ${orgId}, 'owner', ${daysAgo(120)})
  `;

  console.log("Creating connections...");
  const connectionDefs = [
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
  const conn = {};
  for (const [name, type] of connectionDefs) {
    const [row] = await sql`
      INSERT INTO connections (organisation_id, name, type, created_at, updated_at)
      VALUES (${orgId}, ${name}, ${type}, ${daysAgo(120)}, ${daysAgo(1)})
      RETURNING id
    `;
    conn[name] = row.id;
  }

  console.log("Creating spaces...");
  const spaceDefs = ["Winter Programme", "Board Governance", "Fundraising 2026"];
  const space = {};
  for (const name of spaceDefs) {
    const [row] = await sql`
      INSERT INTO spaces (organisation_id, name, description)
      VALUES (${orgId}, ${name}, ${"Space for " + name})
      RETURNING id
    `;
    space[name] = row.id;
  }

  console.log("Assigning connections to spaces...");
  const spaceAssignments = [
    ["Winter Programme", "Sarah Jenkins"],
    ["Winter Programme", "Priya Patel"],
    ["Winter Programme", "Park Road Community Centre"],
    ["Winter Programme", "Winter Programme Volunteers"],
    ["Board Governance", "Tom Reilly"],
    ["Fundraising 2026", "James Okonkwo"],
    ["Fundraising 2026", "Northside Foundation"],
  ];
  for (const [spaceName, connName] of spaceAssignments) {
    await sql`
      INSERT INTO connection_spaces (connection_id, space_id)
      VALUES (${conn[connName]}, ${space[spaceName]})
    `;
  }

  console.log("Creating moments...");
  // [content, daysAgo, [connectionNames], spaceName?]
  const momentDefs = [
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

  // Track co-mention counts to build realistic network_links strengths.
  const pairCounts = new Map();
  function canonicalPair(a, b) {
    return a < b ? [a, b] : [b, a];
  }

  for (const [content, days, names] of momentDefs) {
    const createdAt = daysAgo(days);
    const [moment] = await sql`
      INSERT INTO moments (organisation_id, author_id, content, source, created_at)
      VALUES (${orgId}, ${OWNER_USER_ID}, ${content}, 'manual', ${createdAt})
      RETURNING id
    `;
    const ids = names.map((n) => conn[n]);
    for (const id of ids) {
      await sql`
        INSERT INTO moment_connections (moment_id, connection_id)
        VALUES (${moment.id}, ${id})
      `;
    }
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const [a, b] = canonicalPair(ids[i], ids[j]);
        const key = `${a}::${b}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  console.log("Creating network links...");
  for (const [key, count] of pairCounts) {
    const [a, b] = key.split("::");
    const strength = Math.min(0.5 + 0.1 * (count - 1), 1.0);
    await sql`
      INSERT INTO network_links (organisation_id, source_connection_id, target_connection_id, strength, source)
      VALUES (${orgId}, ${a}, ${b}, ${strength}, 'inferred')
    `;
  }

  console.log("Creating quality history (to demonstrate quality shifts)...");
  // Sarah: deepening relationship over time.
  const sarahQualities = [
    [0.3, 90],
    [0.6, 50],
    [0.9, 10],
  ];
  for (const [position, days] of sarahQualities) {
    await sql`
      INSERT INTO qualities (connection_id, spectrum, position, confidence, source, created_at)
      VALUES (${conn["Sarah Jenkins"]}, 'depth', ${position}, 0.7, 'manual', ${daysAgo(days)})
    `;
  }
  // Northside Foundation: cooling, one-directional funder relationship —
  // directly matches the spec's own example observation.
  const funderQualities = [
    [0.5, 110],
    [0.0, 70],
    [-0.6, 15],
  ];
  for (const [position, days] of funderQualities) {
    await sql`
      INSERT INTO qualities (connection_id, spectrum, position, confidence, source, created_at)
      VALUES (${conn["Northside Foundation"]}, 'reciprocity', ${position}, 0.7, 'manual', ${daysAgo(days)})
    `;
  }

  console.log("Adding a story for Sarah (others stay empty to show that state too)...");
  await sql`
    UPDATE connections
    SET thread_summary = ${"Sarah first appeared on our radar helping frame the winter programme, and quickly became one of our most engaged community connections. She brought Priya in to coordinate volunteers, ran joint sessions with the community centre, and more recently introduced Aisha from Riverside Estate — opening up a whole new part of the community. The relationship has deepened steadily and shows no signs of slowing."},
        thread_updated_at = ${daysAgo(2)}
    WHERE id = ${conn["Sarah Jenkins"]}
  `;

  console.log("\nDone. Organisation slug: seed-demo");
  console.log("Organisation id:", orgId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
