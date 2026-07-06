export interface QualityRow {
  connectionId: string;
  spectrum: string;
  position: number;
  createdAt: Date;
}

export interface QualityShift {
  connectionId: string;
  spectrum: string;
  from: number;
  to: number;
  delta: number;
}

/**
 * Groups quality rows by (connectionId, spectrum) and flags pairs where the
 * position has moved by at least minDelta between the earliest and latest
 * recorded value. Rows must already be sorted by createdAt ascending — this
 * function only groups and compares, it doesn't sort (the caller's DB query
 * already orders by createdAt, matching how other detectors keep DB access
 * separate from pure comparison logic).
 */
export function detectQualityShifts(
  rows: QualityRow[],
  minDelta = 0.4
): QualityShift[] {
  const groups = new Map<string, QualityRow[]>();

  for (const row of rows) {
    const key = `${row.connectionId}::${row.spectrum}`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const shifts: QualityShift[] = [];

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const first = group[0];
    const last = group[group.length - 1];
    const delta = last.position - first.position;

    if (Math.abs(delta) >= minDelta) {
      shifts.push({
        connectionId: first.connectionId,
        spectrum: first.spectrum,
        from: first.position,
        to: last.position,
        delta,
      });
    }
  }

  return shifts;
}
