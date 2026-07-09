import type { OrgExport } from "./types";

export function renderJson(data: OrgExport): string {
  return JSON.stringify(data, null, 2);
}
