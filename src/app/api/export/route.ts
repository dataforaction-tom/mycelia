import { NextRequest } from "next/server";
import { errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { collectOrgData } from "@/lib/export/collect";
import { buildExportArchive } from "@/lib/export/archive";

export async function GET(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Forbidden", 403);
    }

    const data = await collectOrgData(organisationId);
    const zip = buildExportArchive(data);

    const filename = `tending-export-${data.organisation.slug}-${new Date()
      .toISOString()
      .slice(0, 10)}.zip`;

    const headers = new Headers({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(zip.byteLength),
    });

    // `fflate` types its output as `Uint8Array<ArrayBufferLike>`, which the
    // DOM `BodyInit` types reject (the buffer could be a SharedArrayBuffer).
    // Re-view the bytes through a plainly `ArrayBuffer`-backed Uint8Array.
    return new Response(new Uint8Array(zip), { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("Subscription required")) return errorResponse(msg, 402);
    if (msg.includes("Organisation not found")) return errorResponse(msg, 404);
    return errorResponse("Internal server error", 500);
  }
}
