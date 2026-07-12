import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  organisations,
  organisationMemberships,
  moments,
} from "@/lib/db/schema";
import type { OrgRole } from "@/lib/auth/permissions";

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  platformRole: "super_admin" | "user";
  status: "active" | "suspended";
  suspendedAt: Date | null;
  createdAt: Date;
  orgs: { id: string; name: string; slug: string; role: OrgRole }[];
  momentsAuthored: number;
}

export async function getUserDetail(
  userId: string,
): Promise<AdminUserDetail | null> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      platformRole: users.platformRole,
      status: users.status,
      suspendedAt: users.suspendedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const [orgs, momentsCount] = await Promise.all([
    db
      .select({
        id: organisations.id,
        name: organisations.name,
        slug: organisations.slug,
        role: organisationMemberships.role,
      })
      .from(organisationMemberships)
      .innerJoin(
        organisations,
        eq(organisationMemberships.organisationId, organisations.id),
      )
      .where(eq(organisationMemberships.userId, userId)),
    db
      .select({ value: count() })
      .from(moments)
      .where(eq(moments.authorId, userId)),
  ]);

  return {
    ...user,
    orgs,
    momentsAuthored: Number(momentsCount[0]?.value ?? 0),
  };
}
