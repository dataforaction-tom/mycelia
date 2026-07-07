/**
 * Deterministic entity recognition for the moment composer.
 *
 * The set of recognisable entities is always known — the organisation's
 * connections and spaces — so matching is plain text search, not AI. This is
 * what makes the composer's inline chips instant and reliable; the AI
 * understanding endpoint only enhances (event dates, fuzzier mentions).
 */

export type EntityKind = "connection" | "space";

export interface RosterEntry {
  id: string;
  name: string;
  kind: EntityKind;
}

export interface RecognisedEntity {
  id: string;
  kind: EntityKind;
  /** Canonical roster name (e.g. "Sarah Jenkins"). */
  name: string;
  /** The exact text matched in the content (may be just a first name). */
  matchedText: string;
  start: number;
  end: number;
}

const MIN_TOKEN_LENGTH = 3;

function isWordChar(char: string | undefined): boolean {
  return char !== undefined && /[\p{L}\p{N}]/u.test(char);
}

/** All word-boundary occurrences of `needle` in `haystack`, case-insensitive. */
function findOccurrences(haystack: string, needle: string): number[] {
  const positions: number[] = [];
  const lowerHaystack = haystack.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let from = 0;
  while (from <= lowerHaystack.length - lowerNeedle.length) {
    const idx = lowerHaystack.indexOf(lowerNeedle, from);
    if (idx === -1) break;
    const before = haystack[idx - 1];
    const after = haystack[idx + needle.length];
    if (!isWordChar(before) && !isWordChar(after)) positions.push(idx);
    from = idx + 1;
  }
  return positions;
}

/**
 * First-name shorthand is only safe when unambiguous: the token must belong
 * to exactly one roster entry (across every token of every name), so "Sarah"
 * resolves only if no other connection or space mentions a Sarah.
 */
function uniqueFirstTokens(roster: RosterEntry[]): Map<string, RosterEntry> {
  const owners = new Map<string, RosterEntry[]>();
  for (const entry of roster) {
    const seen = new Set<string>();
    for (const token of entry.name.toLowerCase().split(/\s+/)) {
      if (token.length < MIN_TOKEN_LENGTH || seen.has(token)) continue;
      seen.add(token);
      owners.set(token, [...(owners.get(token) ?? []), entry]);
    }
  }

  const unique = new Map<string, RosterEntry>();
  for (const entry of roster) {
    if (entry.kind !== "connection") continue;
    const first = entry.name.toLowerCase().split(/\s+/)[0];
    if (
      first.length >= MIN_TOKEN_LENGTH &&
      first !== entry.name.toLowerCase() &&
      owners.get(first)?.length === 1
    ) {
      unique.set(first, entry);
    }
  }
  return unique;
}

/**
 * Find every roster mention in `content`, returned as non-overlapping spans
 * sorted by position. Longer matches win overlaps (full names beat first-name
 * shorthand), so "Sarah Jenkins" never renders as two chips.
 */
export function matchEntities(
  content: string,
  roster: RosterEntry[],
): RecognisedEntity[] {
  if (!content || roster.length === 0) return [];

  const candidates: RecognisedEntity[] = [];

  for (const entry of roster) {
    if (!entry.name.trim()) continue;
    for (const start of findOccurrences(content, entry.name)) {
      candidates.push({
        id: entry.id,
        kind: entry.kind,
        name: entry.name,
        matchedText: content.slice(start, start + entry.name.length),
        start,
        end: start + entry.name.length,
      });
    }
  }

  for (const [token, entry] of uniqueFirstTokens(roster)) {
    for (const start of findOccurrences(content, token)) {
      candidates.push({
        id: entry.id,
        kind: entry.kind,
        name: entry.name,
        matchedText: content.slice(start, start + token.length),
        start,
        end: start + token.length,
      });
    }
  }

  candidates.sort((a, b) => a.start - b.start || b.end - a.end);

  const accepted: RecognisedEntity[] = [];
  let cursor = 0;
  for (const candidate of candidates) {
    if (candidate.start < cursor) continue;
    accepted.push(candidate);
    cursor = candidate.end;
  }
  return accepted;
}

/** Distinct matched entities (one per id), for counts and submission. */
export function distinctEntities(
  matches: RecognisedEntity[],
): RecognisedEntity[] {
  const byId = new Map<string, RecognisedEntity>();
  for (const match of matches) {
    if (!byId.has(match.id)) byId.set(match.id, match);
  }
  return [...byId.values()];
}
