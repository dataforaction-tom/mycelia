import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Connection {
  id: string;
  name: string;
  type: "person" | "organisation" | "group" | "community";
  updatedAt: Date;
  momentCount: number;
  lastMomentDate: Date | null;
}

const typeColors: Record<string, string> = {
  person: "bg-sky/10 text-sky",
  organisation: "bg-terracotta/10 text-terracotta",
  group: "bg-moss/10 text-moss",
  community: "bg-amber/10 text-amber",
};

export function ConnectionCard({
  connection,
  orgSlug,
}: {
  connection: Connection;
  orgSlug: string;
}) {
  return (
    <Link
      href={`/${orgSlug}/connections/${connection.id}`}
      className="block rounded-xl border border-border bg-white p-4 transition-colors hover:border-terracotta/30 hover:bg-cream"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-bark">{connection.name}</h3>
        <Badge className={typeColors[connection.type] ?? ""}>
          {connection.type}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted">
        {connection.momentCount > 0 && (
          <span>
            {connection.momentCount}{" "}
            {connection.momentCount === 1 ? "moment" : "moments"}
          </span>
        )}
        {connection.lastMomentDate && (
          <span>
            Last:{" "}
            {connection.lastMomentDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>
    </Link>
  );
}
