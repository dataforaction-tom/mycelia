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
      <p className="text-muted">
        No moments yet. Record what&apos;s happening in your relationships.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {moments.map((moment) => (
        <MomentCard
          key={moment.id}
          moment={moment}
          connections={moment.connections}
          orgSlug={orgSlug}
        />
      ))}
    </div>
  );
}
