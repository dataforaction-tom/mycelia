import type { ContactDetails } from "@/lib/db/schema/connections";

interface ContactDetailsCardProps {
  details: ContactDetails;
  /** Whether the current member can edit (shapes the empty-state hint only). */
  canEdit: boolean;
}

/** Turn a bare website into a safe href. */
function websiteHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * Display-only contact details. Editing lives in the single "Edit connection"
 * dialog (see EditConnectionModal) rather than an inline editor here, so there
 * is one place to change a connection's name, type, and contact details.
 */
export function ContactDetailsCard({
  details,
  canEdit,
}: ContactDetailsCardProps) {
  const hasAny = Boolean(
    details.email || details.phone || details.website || details.location
  );

  return (
    <div className="border-border bg-surface shadow-lift rounded-xl border p-6">
      <h2 className="text-muted text-xs font-medium tracking-[0.14em] uppercase">
        Contact
      </h2>

      {hasAny ? (
        <dl className="mt-4 space-y-3 text-sm">
          {details.email && (
            <div>
              <dt className="text-muted text-xs">Email</dt>
              <dd>
                <a
                  href={`mailto:${details.email}`}
                  className="text-moss-dark hover:underline"
                >
                  {details.email}
                </a>
              </dd>
            </div>
          )}
          {details.phone && (
            <div>
              <dt className="text-muted text-xs">Phone</dt>
              <dd>
                <a
                  href={`tel:${details.phone.replace(/\s+/g, "")}`}
                  className="text-bark hover:underline"
                >
                  {details.phone}
                </a>
              </dd>
            </div>
          )}
          {details.website && (
            <div>
              <dt className="text-muted text-xs">Website</dt>
              <dd>
                <a
                  href={websiteHref(details.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-moss-dark hover:underline"
                >
                  {details.website}
                </a>
              </dd>
            </div>
          )}
          {details.location && (
            <div>
              <dt className="text-muted text-xs">Location</dt>
              <dd className="text-bark">{details.location}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="text-muted mt-4 text-sm">
          No contact details yet.
          {canEdit ? ' Use "Edit" to add a way to reach this connection.' : ""}
        </p>
      )}
    </div>
  );
}
