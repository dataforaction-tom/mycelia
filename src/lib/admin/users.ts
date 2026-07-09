import { count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organisationMemberships } from "@/lib/db/schema";

const PAGE_SIZE = 25;

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  platformRole: "super_admin" | "user";
  createdAt: Date;
  orgCount: number;
}

export interface UsersPage {
  rows: AdminUserRow[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getUsersPage({
  page = 1,
  q = "",
}: {
  page?: number;
  q?: string;
}): Promise<UsersPage> {
  const term = q.trim();
  const where: SQL | undefined = term
    ? or(ilike(users.name, `%${term}%`), ilike(users.email, `%${term}%`))
    : undefined;
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        platformRole: users.platformRole,
        createdAt: users.createdAt,
        orgCount: sql<number>`count(${organisationMemberships.organisationId})`,
      })
      .from(users)
      .leftJoin(
        organisationMemberships,
        eq(organisationMemberships.userId, users.id),
      )
      .where(where)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ value: count() }).from(users).where(where),
  ]);

  const total = Number(totalRows[0]?.value ?? 0);

  return {
    rows: rows.map((row) => ({ ...row, orgCount: Number(row.orgCount) })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}
