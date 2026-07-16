"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  userId: string;
  role: string;
  userName: string | null;
  userEmail: string;
  userImage: string | null;
  createdAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface MembersManagerProps {
  organisationId: string;
  currentUserId: string;
  canManage: boolean;
  memberLimit: number;
  initialMembers: Member[];
  initialInvitations: PendingInvitation[];
}

const ASSIGNABLE_ROLES = ["admin", "contributor", "viewer"] as const;

const roleColors: Record<string, string> = {
  owner: "bg-amber/10 text-amber-dark",
  admin: "bg-terracotta/10 text-terracotta-dark",
  contributor: "bg-moss/10 text-moss-dark",
  viewer: "bg-sky/10 text-sky-dark",
};

function initialsOf(member: Member): string {
  const source = member.userName ?? member.userEmail;
  return source.slice(0, 2).toUpperCase();
}

export function MembersManager({
  organisationId,
  currentUserId,
  canManage,
  memberLimit,
  initialMembers,
  initialInvitations,
}: MembersManagerProps) {
  const router = useRouter();
  const members = initialMembers;
  const invitations = initialInvitations;
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const atLimit = members.length + invitations.length >= memberLimit;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || isInviting) return;
    setIsInviting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/organisations/${organisationId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setInviteEmail("");
      setNotice(
        data.data?.pending
          ? "Invitation sent — they'll join when they sign in with this email."
          : "Member added."
      );
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRoleChange(member: Member, role: string) {
    setBusyMemberId(member.userId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/organisations/${organisationId}/members/${member.userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update role");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not update role");
    } finally {
      setBusyMemberId(null);
    }
  }

  async function handleRevoke(invitation: PendingInvitation) {
    if (!confirm(`Revoke the invitation for ${invitation.email}?`)) return;
    setBusyMemberId(invitation.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/organisations/${organisationId}/invitations/${invitation.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not revoke invitation");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not revoke invitation");
    } finally {
      setBusyMemberId(null);
    }
  }

  async function handleRemove(member: Member) {
    if (
      !confirm(
        `Remove ${member.userName ?? member.userEmail} from this organisation?`
      )
    ) {
      return;
    }
    setBusyMemberId(member.userId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/organisations/${organisationId}/members/${member.userId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not remove member");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not remove member");
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="border-moss/30 bg-moss/10 text-moss-dark rounded-lg border p-3 text-sm"
        >
          {notice}
        </div>
      )}

      {/* Invite form — managers only */}
      {canManage && (
        <form
          onSubmit={handleInvite}
          className="border-border rounded-xl border bg-white p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              aria-label="Email address to invite"
              placeholder="Email address"
              disabled={atLimit}
              className="border-border text-bark placeholder:text-muted-light focus:border-terracotta focus:ring-terracotta flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              disabled={atLimit}
              aria-label="Role for the invited member"
              className="border-border text-bark focus:border-terracotta focus:ring-terracotta rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
            >
              <option value="viewer">Viewer</option>
              <option value="contributor">Contributor</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={isInviting || atLimit || !inviteEmail.trim()}
              className="bg-terracotta-dark hover:bg-bark rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {isInviting ? "Adding…" : "Add member"}
            </button>
          </div>
          <p className="text-muted mt-2 text-xs">
            {atLimit
              ? `Your plan allows up to ${memberLimit} members. Upgrade to add more.`
              : "The person must already have a Tending account with this email address."}
          </p>
        </form>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <p className="text-muted">No members yet.</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const isOwner = member.role === "owner";
            const canEditThis = canManage && !isSelf && !isOwner;
            const isBusy = busyMemberId === member.userId;

            return (
              <div
                key={member.userId}
                className="border-border flex items-center justify-between gap-3 rounded-lg border bg-white p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {member.userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.userImage}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-cream-dark text-bark flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                      {initialsOf(member)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-bark truncate font-medium">
                      {member.userName ?? member.userEmail}
                      {isSelf && (
                        <span className="text-muted ml-2 text-xs">(you)</span>
                      )}
                    </p>
                    {member.userName && (
                      <p className="text-muted truncate text-sm">
                        {member.userEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {canEditThis ? (
                    <select
                      value={member.role}
                      disabled={isBusy}
                      onChange={(e) => handleRoleChange(member, e.target.value)}
                      className="border-border text-bark focus:border-terracotta focus-visible:ring-terracotta rounded-lg border px-2 py-1 text-xs capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:opacity-50"
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleColors[member.role] ?? ""}`}
                    >
                      {member.role}
                    </span>
                  )}
                  {canEditThis && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      disabled={isBusy}
                      className="text-muted hover:text-destructive rounded-lg px-2 py-1 text-xs disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pending invitations — people invited before they've signed up */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-muted text-xs font-medium tracking-[0.12em] uppercase">
            Pending invitations
          </h2>
          {invitations.map((invitation) => {
            const isBusy = busyMemberId === invitation.id;
            return (
              <div
                key={invitation.id}
                className="border-border bg-cream/40 flex items-center justify-between gap-3 rounded-lg border border-dashed p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="border-border text-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed text-xs">
                    ✉
                  </div>
                  <div className="min-w-0">
                    <p className="text-bark truncate font-medium">
                      {invitation.email}
                    </p>
                    <p className="text-muted text-xs">
                      Invited as {invitation.role} · not yet joined
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="bg-amber/10 text-amber-dark rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                    Pending
                  </span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(invitation)}
                      disabled={isBusy}
                      className="text-muted hover:text-destructive rounded-lg px-2 py-1 text-xs disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
