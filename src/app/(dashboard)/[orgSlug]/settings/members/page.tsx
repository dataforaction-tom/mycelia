"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Member {
  userId: string;
  role: string;
  userName: string | null;
  userEmail: string;
  userImage: string | null;
  createdAt: string;
}

export default function MembersPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd resolve the orgSlug to orgId and fetch members
    // For now, this shows the UI structure
    setLoading(false);
  }, [orgSlug]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;

    // Would call POST /api/organisations/[orgId]/members
    setInviteEmail("");
  }

  const roleColors: Record<string, string> = {
    owner: "bg-amber/10 text-amber",
    admin: "bg-terracotta/10 text-terracotta",
    contributor: "bg-moss/10 text-moss",
    viewer: "bg-sky/10 text-sky",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Members</h1>
        <p className="mt-1 text-sm text-muted">
          Manage who has access to your organisation
        </p>
      </div>

      {/* Invite form */}
      <form
        onSubmit={handleInvite}
        className="flex gap-3 rounded-xl border border-border bg-white p-4"
      >
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Email address"
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        >
          <option value="viewer">Viewer</option>
          <option value="contributor">Contributor</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark"
        >
          Invite
        </button>
      </form>

      {/* Members list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-cream-dark"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-muted">
          No members yet. Invite people to collaborate.
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between rounded-lg border border-border bg-white p-4"
            >
              <div>
                <p className="font-medium text-bark">
                  {member.userName ?? member.userEmail}
                </p>
                {member.userName && (
                  <p className="text-sm text-muted">{member.userEmail}</p>
                )}
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleColors[member.role] ?? ""}`}
              >
                {member.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
