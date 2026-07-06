import { MomentCard } from "./moment-card";

interface MomentConnection {
  id: string;
  name: string;
  type: string;
}

interface MomentAuthor {
  name: string | null;
  email: string;
}

interface Moment {
  id: string;
  content: string;
  source: string;
  createdAt: Date;
  eventDate: Date | null;
  connections?: MomentConnection[];
  author?: MomentAuthor | null;
}

interface MomentListProps {
  moments: Moment[];
  orgSlug: string;
}

export function MomentList({ moments, orgSlug }: MomentListProps) {
  if (moments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
        <p className="font-display text-lg text-bark">
          Nothing in the river yet
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          A moment is anything that happened — a conversation, a meeting, a
          message. Record the first one and the story starts.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* The thread: one continuous hypha running through every moment */}
      <div
        className="absolute bottom-3 left-[7px] top-3 w-px bg-gradient-to-b from-moss/70 via-moss/30 to-transparent"
        aria-hidden="true"
      />
      <div className="space-y-4">
        {moments.map((moment) => (
          <div key={moment.id} className="relative pl-8">
            <span
              className="absolute left-[2px] top-5 h-[11px] w-[11px] rounded-full border-2 border-moss bg-cream"
              aria-hidden="true"
            />
            <MomentCard
              moment={moment}
              connections={moment.connections}
              orgSlug={orgSlug}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
