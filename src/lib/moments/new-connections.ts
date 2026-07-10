export type ConnectionType = "person" | "organisation" | "group" | "community";

/** An entity the AI extracted from a moment (see moment-understanding.ts). */
interface EntityMention {
  name: string;
  connectionId: string | null;
  type: ConnectionType | null;
}

interface RosterConnection {
  id: string;
  name: string;
}

export interface NewConnectionSuggestion {
  name: string;
  type: ConnectionType;
}

/** Lowercase, trim, and collapse internal whitespace for comparison. */
function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * From the AI's extracted entities, produce the list of *new* connections worth
 * suggesting. This is the data-integrity guard for the feature: it must never
 * surface something that would become a duplicate of an existing connection.
 *
 * - keeps only entities the AI couldn't match to an existing connection
 *   (`connectionId === null`);
 * - drops any whose normalised name equals, contains, or is contained by an
 *   existing connection's name — so "Amara" isn't suggested when "Amara Okafor"
 *   already exists (both directions). Deliberately conservative: a near-miss is
 *   dropped rather than risk a duplicate;
 * - de-dupes repeated mentions within one moment (normalised, first wins);
 * - defaults an unknown type to "person".
 */
export function newConnectionSuggestions(
  entities: EntityMention[],
  roster: RosterConnection[],
): NewConnectionSuggestion[] {
  const rosterNames = roster.map((connection) => normalise(connection.name));
  const seen = new Set<string>();
  const suggestions: NewConnectionSuggestion[] = [];

  for (const entity of entities) {
    if (entity.connectionId !== null) continue;

    const norm = normalise(entity.name);
    if (!norm) continue;

    const matchesExisting = rosterNames.some(
      (rosterName) =>
        rosterName === norm ||
        rosterName.includes(norm) ||
        norm.includes(rosterName),
    );
    if (matchesExisting) continue;

    if (seen.has(norm)) continue;
    seen.add(norm);

    suggestions.push({ name: entity.name.trim(), type: entity.type ?? "person" });
  }

  return suggestions;
}
