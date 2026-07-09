import { stringify } from "yaml";
import type { OrgExport } from "./types";

/** Same graph as JSON, YAML syntax. Round-tripping through JSON first
 *  normalises Dates to ISO strings so YAML and JSON compare equal. */
export function renderYaml(data: OrgExport): string {
  return stringify(JSON.parse(JSON.stringify(data)));
}
