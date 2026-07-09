import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { collectOrgData } from "@/lib/export/collect";
import { scopeToConnection } from "@/lib/export/collect-connection";
import { buildExportArchive } from "@/lib/export/archive";

type Params = { params: Promise<{ connectionId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { connectionId } = await params;

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const [connection] = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.id, connectionId),
          eq(connections.organisationId, organisationId),
        ),
      )
      .limit(1);

    if (!connection) return errorResponse("Connection not found", 404);

    const data = scopeToConnection(
      await collectOrgData(organisationId),
      connectionId,
    );
    const zip = buildExportArchive(data);

    // Slug the connection name for a human-friendly filename; fall back to the
    // id if the name has no usable alphanumerics.
    const nameSlug =
      connection.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || connection.id;
    const filename = `tending-${nameSlug}-${new Date()
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
