import { errorResponse } from "@/lib/utils/api";
import { getApiContext, apiErrorResponse } from "@/lib/api-keys/context";
import { collectOrgData } from "@/lib/export/collect";
import { renderJson } from "@/lib/export/json";
import { renderYaml } from "@/lib/export/yaml";
import { buildExportArchive } from "@/lib/export/archive";

const SUPPORTED_FORMATS = new Set(["json", "yaml", "okf"]);

export async function GET(request: Request) {
  try {
    const { organisationId } = await getApiContext(request, "read");

    const format = new URL(request.url).searchParams.get("format") ?? "json";
    if (!SUPPORTED_FORMATS.has(format)) {
      return errorResponse(`Unsupported format: ${format}`, 422);
    }

    const data = await collectOrgData(organisationId);

    if (format === "json") {
      return new Response(renderJson(data), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (format === "yaml") {
      return new Response(renderYaml(data), {
        headers: { "Content-Type": "application/x-yaml" },
      });
    }

    // okf — Open Knowledge Framework archive (zip). Mirrors the response
    // shape and filename pattern of the interactive `/api/export` route.
    const zip = buildExportArchive(data);
    const filename = `tending-export-${data.organisation.slug}-${new Date()
      .toISOString()
      .slice(0, 10)}.zip`;

    // `fflate` types its output as `Uint8Array<ArrayBufferLike>`, which the
    // DOM `BodyInit` types reject (the buffer could be a SharedArrayBuffer).
    // Re-view the bytes through a plainly `ArrayBuffer`-backed Uint8Array.
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zip.byteLength),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Organisation not found")) {
      return errorResponse(message, 404);
    }
    return apiErrorResponse(error);
  }
}
