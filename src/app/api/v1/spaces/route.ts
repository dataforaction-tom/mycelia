import { db } from "@/lib/db";
import { spaces } from "@/lib/db/schema";
import { successResponse } from "@/lib/utils/api";
import { getApiContext, apiErrorResponse } from "@/lib/api-keys/context";
import { parsePagination } from "@/lib/api/pagination";
import { desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { organisationId } = await getApiContext(request, "read");
    const { limit, offset } = parsePagination(request);

    const rows = await db
      .select()
      .from(spaces)
      .where(eq(spaces.organisationId, organisationId))
      .orderBy(desc(spaces.createdAt))
      .limit(limit)
      .offset(offset);

    return successResponse({ data: rows });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
