import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { organisationMemberships } from "@/lib/db/schema";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
import { createOrganisationSchema } from "@/lib/validators/organisations";
import { slugify } from "@/lib/utils/slugify";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const parsed = createOrganisationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const slug = slugify(parsed.data.name);

    // Check slug uniqueness
    const [existing] = await db
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.slug, slug))
      .limit(1);

    if (existing) {
      return errorResponse("An organisation with this name already exists", 409);
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const [org] = await db
      .insert(organisations)
      .values({
        name: parsed.data.name,
        slug,
        plan: "trial",
        trialEndsAt,
      })
      .returning();

    // Make the creator the owner
    await db.insert(organisationMemberships).values({
      userId: user.id,
      organisationId: org.id,
      role: "owner",
      acceptedAt: new Date(),
    });

    return successResponse(org, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return errorResponse("Not authenticated", 401);
    }
    return errorResponse("Internal server error", 500);
  }
}
