const STRENGTH_INCREMENT = 0.1;
const MAX_STRENGTH = 1.0;
const DEFAULT_STRENGTH = 0.5;

/**
 * Given the current strength of a link (or undefined if the link doesn't
 * exist yet), return the strength after one additional co-mention.
 */
export function nextStrength(currentStrength: number | undefined): number {
  if (currentStrength === undefined) return DEFAULT_STRENGTH;
  return Math.min(currentStrength + STRENGTH_INCREMENT, MAX_STRENGTH);
}

/**
 * Canonicalise a pair of connection IDs so (a, b) and (b, a) always produce
 * the same [source, target] ordering — required for the network_links
 * UNIQUE(source, target) index to dedupe undirected relationships.
 */
export function canonicalPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

/**
 * Given connection IDs co-mentioned in a single moment, return every unique
 * canonical pair (no self-pairs, no duplicate reverse pairs).
 */
export function pairsFromConnectionIds(
  connectionIds: string[]
): Array<[string, string]> {
  const unique = Array.from(new Set(connectionIds)).sort();
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      pairs.push(canonicalPair(unique[i], unique[j]));
    }
  }
  return pairs;
}
