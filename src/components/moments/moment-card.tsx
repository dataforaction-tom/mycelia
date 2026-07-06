import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface MomentConnection {
  id: string;
  name: string;
  type: string;
}

interface MomentAuthor {
  name: string | null;
  email: string;
}

interface MomentCardProps {
  moment: {
    id: string;
    content: string;
    source: string;
    createdAt: Date;
    eventDate: Date | null;
    author?: MomentAuthor | null;
  };
  connections?: MomentConnection[];
  orgSlug: string;
}

const typeColors: Record<string, string> = {
  person: "bg-sky/10 text-sky",
  organisation: "bg-terracotta/10 text-terracotta",
  group: "bg-moss/10 text-moss",
  community: "bg-amber/10 text-amber",
};

export function MomentCard({
  moment,
  connections = [],
  orgSlug,
}: MomentCardProps) {
  const displayDate = moment.eventDate ?? moment.createdAt;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-lift transition-shadow hover:shadow-hover">
      <p className="text-[15px] leading-relaxed text-bark">{moment.content}</p>

      {connections.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {connections.map((c) => (
            <Link key={c.id} href={`/${orgSlug}/connections/${c.id}`}>
              <Badge
                className={`cursor-pointer transition-opacity hover:opacity-80 ${typeColors[c.type] ?? ""}`}
              >
                {c.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span className="font-mono">
          {displayDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        {moment.source !== "manual" && (
          <span className="rounded bg-cream-dark px-1.5 py-0.5">
            {moment.source}
          </span>
        )}
        {moment.author && (
          <span>&middot; {moment.author.name ?? moment.author.email}</span>
        )}
      </div>
    </div>
  );
}
