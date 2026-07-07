import Link from "next/link";
import { ConnectionTypeBadge } from "@/components/ui/connection-type-badge";

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

export function MomentCard({
  moment,
  connections = [],
  orgSlug,
}: MomentCardProps) {
  const displayDate = moment.eventDate ?? moment.createdAt;

  return (
    <div className="rounded-[18px] border border-border bg-white/85 p-4 shadow-lift transition-shadow hover:shadow-hover">
      <p className="text-[15px] leading-relaxed text-bark">{moment.content}</p>

      {connections.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {connections.map((c) => (
            <Link key={c.id} href={`/${orgSlug}/connections/${c.id}`}>
              <ConnectionTypeBadge
                type={c.type}
                className="cursor-pointer transition-opacity hover:opacity-80"
              >
                {c.name}
              </ConnectionTypeBadge>
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
