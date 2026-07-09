import { zipSync, strToU8 } from "fflate";
import type { OrgExport } from "./types";
import { renderJson } from "./json";
import { renderYaml } from "./yaml";
import { renderOkf } from "./okf";

function readme(data: OrgExport): string {
  return `# Tending export — ${data.organisation.name}\n\n` +
    `Generated ${data.exportedAt}.\n\n` +
    `- \`data.json\` / \`data.yaml\` — full-fidelity structured mirror.\n` +
    `- \`okf/\` — Open Knowledge Format bundle: cross-linked Markdown, human- and AI-readable. Start at \`okf/index.md\`.\n`;
}

/** Assemble the full export as a zip (Uint8Array). Pure — no DB, no IO. */
export function buildExportArchive(data: OrgExport): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "README.md": strToU8(readme(data)),
    "data.json": strToU8(renderJson(data)),
    "data.yaml": strToU8(renderYaml(data)),
  };
  for (const [path, contents] of Object.entries(renderOkf(data))) {
    files[path] = strToU8(contents);
  }
  return zipSync(files);
}
