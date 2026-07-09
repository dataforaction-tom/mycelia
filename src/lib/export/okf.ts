import { stringify } from "yaml";
import type { OrgExport, FileTree } from "./types";

/**
 * OKF (Open Knowledge Format) renderer.
 *
 * Produces a self-contained bundle of cross-linked Markdown files, each with
 * YAML frontmatter. This is a PURE function of the export graph — no DB, no IO.
 * Every inter-document reference is a relative markdown link so the bundle can
 * be browsed as a standalone knowledge graph.
 */

/** Build a YAML frontmatter block, omitting null/undefined keys for cleanliness. */
function frontmatter(obj: Record<string, unknown>): string {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) clean[key] = value;
  }
  return `---\n${stringify(clean)}---\n`;
}

/**
 * Deterministic file-safe slug from a human name, suffixed with the first 8
 * chars of the id so distinct records never collide on the same slug.
 */
function slugify(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = id.replace(/[^a-z0-9]/gi, "").slice(0, 8);
  return base ? `${base}-${suffix}` : suffix;
}

/** ISO date string (or undefined) from a Date-like value. */
function iso(value: Date | string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}

/** Escape a pipe so it doesn't break a Markdown table cell. */
function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

export function renderOkf(data: OrgExport): FileTree {
  const tree: FileTree = {};

  // Precompute stable slugs / filenames keyed by id.
  const connectionSlug = new Map<string, string>();
  for (const connection of data.connections) {
    connectionSlug.set(connection.id, slugify(connection.name, connection.id));
  }
  const spaceSlug = new Map<string, string>();
  for (const space of data.spaces) {
    spaceSlug.set(space.id, slugify(space.name, space.id));
  }

  // Adjacency: connection -> moment ids, and moment -> connection ids.
  const momentsByConnection = new Map<string, string[]>();
  const connectionsByMoment = new Map<string, string[]>();
  for (const link of data.momentConnections) {
    if (!momentsByConnection.has(link.connectionId)) {
      momentsByConnection.set(link.connectionId, []);
    }
    momentsByConnection.get(link.connectionId)!.push(link.momentId);
    if (!connectionsByMoment.has(link.momentId)) {
      connectionsByMoment.set(link.momentId, []);
    }
    connectionsByMoment.get(link.momentId)!.push(link.connectionId);
  }

  // Connection -> space ids (membership).
  const spacesByConnection = new Map<string, string[]>();
  for (const link of data.connectionSpaces) {
    if (!spacesByConnection.has(link.connectionId)) {
      spacesByConnection.set(link.connectionId, []);
    }
    spacesByConnection.get(link.connectionId)!.push(link.spaceId);
  }

  const momentById = new Map(data.moments.map((moment) => [moment.id, moment]));
  const connectionById = new Map(
    data.connections.map((connection) => [connection.id, connection]),
  );

  // --- Small local link/list helpers (DRY) -------------------------------

  /** A `- [label](../moments/<id>.md)` line for one moment, from a connection doc. */
  function momentLink(momentId: string): string {
    const moment = momentById.get(momentId);
    const label = iso(moment?.eventDate) ?? "moment";
    return `- [${label}](../moments/${momentId}.md)`;
  }

  /** A `- [name](../connections/<slug>.md)` line for one connection. */
  function connectionLink(connectionId: string): string {
    const connection = connectionById.get(connectionId);
    const slug = connectionSlug.get(connectionId) ?? connectionId;
    return `- [${connection?.name ?? connectionId}](../connections/${slug}.md)`;
  }

  /** A `- [name](../spaces/<slug>.md)` line for one space. */
  function spaceLink(spaceId: string): string {
    const space = data.spaces.find((candidate) => candidate.id === spaceId);
    const slug = spaceSlug.get(spaceId) ?? spaceId;
    return `- [${space?.name ?? spaceId}](../spaces/${slug}.md)`;
  }

  // --- index.md ----------------------------------------------------------

  tree["okf/index.md"] = [
    frontmatter({
      type: "index",
      id: data.organisation.id,
      title: data.organisation.name,
      exported_at: data.exportedAt,
    }),
    `# ${data.organisation.name}`,
    "",
    `Exported at ${data.exportedAt}.`,
    "",
    "## Contents",
    "",
    `- Connections: ${data.connections.length}`,
    `- Moments: ${data.moments.length}`,
    `- Spaces: ${data.spaces.length}`,
    `- Observations: ${data.observations.length}`,
    "",
    "## Explore",
    "",
    "- [Connections](connections/)",
    "- [Moments](moments/)",
    "- [Spaces](spaces/)",
    "- [Observations](observations/index.md)",
    "- [Members](members.md)",
    "",
  ].join("\n");

  // --- connections/<slug>.md ---------------------------------------------

  for (const connection of data.connections) {
    const slug = connectionSlug.get(connection.id)!;
    const contact = (connection.contactDetails ?? {}) as Record<string, unknown>;
    const metadata = (connection.metadata ?? {}) as Record<string, unknown>;
    const tags = Array.isArray(metadata.tags) ? metadata.tags : undefined;
    const hasSummary =
      connection.threadSummary !== null && connection.threadSummary !== undefined;

    const lines: string[] = [
      frontmatter({
        type: connection.type,
        id: connection.id,
        title: connection.name,
        email: contact.email,
        phone: contact.phone,
        location: contact.location,
        tags,
        created: iso(connection.createdAt),
        // Provenance: thread summaries are AI-inferred, never human-authored text.
        thread_summary_source: hasSummary ? "inferred" : undefined,
      }),
      `# ${connection.name}`,
      "",
    ];

    if (hasSummary) {
      lines.push(
        "## Thread summary",
        "",
        "> AI-written summary (inferred), not authored by a human.",
        "",
        connection.threadSummary as string,
        "",
      );
    }

    const connectionQualities = data.qualities.filter(
      (quality) => quality.connectionId === connection.id,
    );
    if (connectionQualities.length > 0) {
      lines.push("## Qualities", "");
      for (const quality of connectionQualities) {
        lines.push(`- ${quality.spectrum}: ${quality.position}`);
      }
      lines.push("");
    }

    const connectionMoments = momentsByConnection.get(connection.id) ?? [];
    if (connectionMoments.length > 0) {
      lines.push("## Moments", "");
      for (const momentId of connectionMoments) lines.push(momentLink(momentId));
      lines.push("");
    }

    const connectionSpaceIds = spacesByConnection.get(connection.id) ?? [];
    if (connectionSpaceIds.length > 0) {
      lines.push("## Spaces", "");
      for (const spaceId of connectionSpaceIds) lines.push(spaceLink(spaceId));
      lines.push("");
    }

    tree[`okf/connections/${slug}.md`] = lines.join("\n");
  }

  // --- moments/<momentId>.md ---------------------------------------------

  for (const moment of data.moments) {
    const lines: string[] = [
      frontmatter({
        type: "moment",
        id: moment.id,
        source: moment.source,
        event_date: iso(moment.eventDate),
        created: iso(moment.createdAt),
        author: moment.authorId ?? null,
      }),
      moment.content,
      "",
    ];

    const linkedConnections = connectionsByMoment.get(moment.id) ?? [];
    if (linkedConnections.length > 0) {
      lines.push("## Connections", "");
      for (const connectionId of linkedConnections) {
        lines.push(connectionLink(connectionId));
      }
      lines.push("");
    }

    if (moment.spaceId) {
      lines.push("## Space", "", spaceLink(moment.spaceId), "");
    }

    tree[`okf/moments/${moment.id}.md`] = lines.join("\n");
  }

  // --- spaces/<slug>.md --------------------------------------------------

  for (const space of data.spaces) {
    const slug = spaceSlug.get(space.id)!;
    const lines: string[] = [
      frontmatter({
        type: "space",
        id: space.id,
        title: space.name,
        created: iso(space.createdAt),
      }),
      `# ${space.name}`,
      "",
    ];

    if (space.description) {
      lines.push(space.description, "");
    }

    const memberIds = data.connectionSpaces
      .filter((link) => link.spaceId === space.id)
      .map((link) => link.connectionId);
    if (memberIds.length > 0) {
      lines.push("## Members", "");
      for (const connectionId of memberIds) {
        lines.push(connectionLink(connectionId));
      }
      lines.push("");
    }

    const spaceMoments = data.moments.filter(
      (moment) => moment.spaceId === space.id,
    );
    if (spaceMoments.length > 0) {
      lines.push("## Moments", "");
      for (const moment of spaceMoments) lines.push(momentLink(moment.id));
      lines.push("");
    }

    tree[`okf/spaces/${slug}.md`] = lines.join("\n");
  }

  // --- observations/index.md ---------------------------------------------

  const observationLines: string[] = [
    frontmatter({
      type: "observations",
      id: data.organisation.id,
      title: `Observations for ${data.organisation.name}`,
    }),
    "# Observations",
    "",
  ];
  for (const observation of data.observations) {
    observationLines.push(
      `## ${observation.type}`,
      "",
      observation.content,
      "",
      `Status: ${observation.status}`,
      "",
    );
    const referenced = (observation.connections ?? []) as string[];
    if (referenced.length > 0) {
      observationLines.push("Referenced connections:", "");
      for (const connectionId of referenced) {
        observationLines.push(connectionLink(connectionId));
      }
      observationLines.push("");
    }
  }
  tree["okf/observations/index.md"] = observationLines.join("\n");

  // --- members.md --------------------------------------------------------

  const memberLines: string[] = [
    frontmatter({
      type: "members",
      id: data.organisation.id,
      title: `Members of ${data.organisation.name}`,
    }),
    "# Members",
    "",
    "| Role | Name | Email |",
    "| --- | --- | --- |",
  ];
  for (const member of data.members) {
    memberLines.push(`| ${member.role} | ${escapeCell(member.name ?? "")} | ${escapeCell(member.email)} |`);
  }
  memberLines.push("");
  tree["okf/members.md"] = memberLines.join("\n");

  return tree;
}
