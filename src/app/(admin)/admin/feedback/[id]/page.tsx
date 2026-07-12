import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeedbackDetail } from "@/lib/admin/feedback";
import {
  FeedbackStatusBadge,
  FeedbackTypeBadge,
  FeedbackPriorityBadge,
} from "@/components/admin/feedback-badges";
import { FeedbackTriage } from "@/components/admin/feedback-triage";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminFeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getFeedbackDetail(id);

  if (!item) notFound();

  return (
    <div className="stagger-children space-y-6">
      <div>
        <Link
          href="/admin/feedback"
          className="text-sm text-muted hover:text-terracotta"
        >
          ← Feedback
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-bark">{item.title}</h1>
          <FeedbackTypeBadge type={item.type} />
          <FeedbackStatusBadge status={item.status} />
          <FeedbackPriorityBadge priority={item.priority} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-white/80 p-5 shadow-lift">
            <h2 className="mb-2 font-display text-lg text-bark">Detail</h2>
            <p className="whitespace-pre-wrap text-sm text-bark">{item.body}</p>
          </div>

          <div className="rounded-xl border border-border bg-white/80 p-5 shadow-lift">
            <h2 className="mb-4 font-display text-lg text-bark">Triage</h2>
            <FeedbackTriage
              id={item.id}
              status={item.status}
              priority={item.priority}
              adminNotes={item.adminNotes}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white/80 p-5 shadow-lift">
          <h2 className="font-display text-lg text-bark">Context</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted">From</dt>
              <dd className="text-bark">
                {item.submitterName ?? item.submitterEmail ?? "Unknown"}
              </dd>
              {item.submitterEmail && (
                <dd className="text-xs text-muted">{item.submitterEmail}</dd>
              )}
            </div>
            <div>
              <dt className="text-muted">Organisation</dt>
              <dd className="text-bark">{item.orgName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Submitted from</dt>
              <dd className="break-all text-bark">{item.pageUrl ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Received</dt>
              <dd className="text-bark">{formatDateTime(item.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">Updated</dt>
              <dd className="text-bark">{formatDateTime(item.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
