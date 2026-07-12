import { and, count, desc, eq, ne, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedback, users, organisations } from "@/lib/db/schema";

const PAGE_SIZE = 25;

export type FeedbackType = "bug" | "feature" | "other";
export type FeedbackStatus =
  | "new"
  | "triaged"
  | "planned"
  | "in_progress"
  | "done"
  | "declined";
export type FeedbackPriority = "low" | "medium" | "high";

export interface FeedbackRow {
  id: string;
  type: FeedbackType;
  title: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  createdAt: Date;
  submitterName: string | null;
  submitterEmail: string | null;
  orgName: string | null;
}

export interface FeedbackPage {
  rows: FeedbackRow[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getFeedbackPage({
  page = 1,
  status,
  type,
  priority,
}: {
  page?: number;
  status?: FeedbackStatus;
  type?: FeedbackType;
  priority?: FeedbackPriority;
}): Promise<FeedbackPage> {
  const filters: SQL[] = [];
  if (status) filters.push(eq(feedback.status, status));
  if (type) filters.push(eq(feedback.type, type));
  if (priority) filters.push(eq(feedback.priority, priority));
  const where = filters.length ? and(...filters) : undefined;
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: feedback.id,
        type: feedback.type,
        title: feedback.title,
        status: feedback.status,
        priority: feedback.priority,
        createdAt: feedback.createdAt,
        submitterName: users.name,
        submitterEmail: users.email,
        orgName: organisations.name,
      })
      .from(feedback)
      .leftJoin(users, eq(feedback.userId, users.id))
      .leftJoin(organisations, eq(feedback.organisationId, organisations.id))
      .where(where)
      .orderBy(desc(feedback.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ value: count() }).from(feedback).where(where),
  ]);

  const total = Number(totalRows[0]?.value ?? 0);
  return {
    rows,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export interface FeedbackDetail extends FeedbackRow {
  body: string;
  adminNotes: string | null;
  pageUrl: string | null;
  updatedAt: Date;
}

export async function getFeedbackDetail(
  id: string,
): Promise<FeedbackDetail | null> {
  const [row] = await db
    .select({
      id: feedback.id,
      type: feedback.type,
      title: feedback.title,
      body: feedback.body,
      status: feedback.status,
      priority: feedback.priority,
      adminNotes: feedback.adminNotes,
      pageUrl: feedback.pageUrl,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      submitterName: users.name,
      submitterEmail: users.email,
      orgName: organisations.name,
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.userId, users.id))
    .leftJoin(organisations, eq(feedback.organisationId, organisations.id))
    .where(eq(feedback.id, id))
    .limit(1);

  return row ?? null;
}

/** Count of feedback still needing attention (anything not done/declined). */
export async function getOpenFeedbackCount(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(feedback)
    .where(and(ne(feedback.status, "done"), ne(feedback.status, "declined")));
  return Number(row?.value ?? 0);
}
