import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  CONNECTION_TYPE_COLORS,
  CONNECTION_TYPE_COLORS_GLOW,
  type ConnectionType,
} from "@/lib/config/theme";
import { vitalityOf, vitalityLabel } from "@/lib/network/vitality";

interface Connection {
  id: string;
  name: string;
  type: ConnectionType;
  updatedAt: Date;
  momentCount: number;
  lastMomentDate: Date | null;
  /** Omitted (undefined) where the caller doesn't load stories, e.g. search */
  threadSummary?: string | null;
}

const VITALITY_TEXT: Record<string, string> = {
  fresh: "text-moss-dark",
  active: "text-moss-dark",
  fading: "text-amber-dark",
  dormant: "text-muted",
};

const VITALITY_DOT: Record<string, string> = {
  fresh: "bg-moss animate-breathe",
  active: "bg-moss",
  fading: "bg-amber",
  dormant: "bg-muted-light",
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ConnectionCard({
  connection,
  orgSlug,
}: {
  connection: Connection;
  orgSlug: string;
}) {
  const vitality = vitalityOf(connection.lastMomentDate);
  const baseColor = CONNECTION_TYPE_COLORS[connection.type];
  const glowColor = CONNECTION_TYPE_COLORS_GLOW[connection.type];

  return (
    <Link
      href={`/${orgSlug}/connections/${connection.id}`}
      className={cn(
        "border-border bg-surface shadow-lift hover:border-terracotta/30 hover:shadow-hover flex flex-col rounded-xl border p-4 transition-all hover:-translate-y-0.5",
        // Dormant relationships rest: quieter, but never hidden
        vitality === "dormant" && "opacity-80 saturate-[.85]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* The connection's node, surfaced from the underground */}
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${glowColor}, ${baseColor})`,
            boxShadow: `0 0 14px ${baseColor}55`,
          }}
          aria-hidden="true"
        >
          {initialsOf(connection.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-bark truncate font-semibold">
            {connection.name}
          </h3>
          <p className="text-muted text-xs capitalize">{connection.type}</p>
        </div>
      </div>

      {connection.threadSummary && (
        <p className="text-bark-light mt-3 line-clamp-2 font-serif text-sm leading-relaxed italic">
          {connection.threadSummary}
        </p>
      )}

      <div className="border-border/60 mt-3 flex items-center justify-between gap-2 border-t pt-3 text-xs">
        <span
          className={cn(
            "flex items-center gap-1.5 font-medium",
            VITALITY_TEXT[vitality]
          )}
        >
          <span
            className={cn("h-2 w-2 rounded-full", VITALITY_DOT[vitality])}
            aria-hidden="true"
          />
          {vitalityLabel(connection.lastMomentDate)}
        </span>
        <span className="text-muted font-mono">
          {connection.momentCount}{" "}
          {connection.momentCount === 1 ? "moment" : "moments"}
        </span>
      </div>
    </Link>
  );
}
