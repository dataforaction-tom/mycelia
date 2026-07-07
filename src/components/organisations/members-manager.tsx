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
  owner: "bg-amber/10 text-amber",
  admin: "bg-terracotta/10 text-terracotta",
  contributor: "bg-moss/10 text-moss",
  viewer: "bg-sky/10 text-sky",
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
      const res = await fetch(
        `/api/organisations/${organisationId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
        }
      );
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-moss/30 bg-moss/10 p-3 text-sm text-moss-dark">
          {notice}
        </div>
      )}

      {/* Invite form — managers only */}
      {canManage && (
        <form
          onSubmit={handleInvite}
          className="rounded-xl border border-border bg-white p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              disabled={atLimit}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta disabled:opacity-50"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              disabled={atLimit}
              className="rounded-lg border border-border px-3 py-2 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta disabled:opacity-50"
            >
              <option value="viewer">Viewer</option>
              <option value="contributor">Contributor</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={isInviting || atLimit || !inviteEmail.trim()}
              className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
            >
              {isInviting ? "Adding…" : "Add member"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
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
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white p-4"
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-dark text-xs font-medium text-bark">
                      {initialsOf(member)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-bark">
                      {member.userName ?? member.userEmail}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted">(you)</span>
                      )}
                    </p>
                    {member.userName && (
                      <p className="truncate text-sm text-muted">
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
                      className="rounded-lg border border-border px-2 py-1 text-xs capitalize text-bark focus:border-terracotta focus:outline-none disabled:opacity-50"
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
                      className="rounded-lg px-2 py-1 text-xs text-muted hover:text-destructive disabled:opacity-50"
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
          <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
            Pending invitations
          </h2>
          {invitations.map((invitation) => {
            const isBusy = busyMemberId === invitation.id;
            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-cream/40 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted">
                    ✉
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-bark">
                      {invitation.email}
                    </p>
                    <p className="text-xs text-muted">
                      Invited as {invitation.role} · not yet joined
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-xs font-medium capitalize text-amber">
                    Pending
                  </span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(invitation)}
                      disabled={isBusy}
                      className="rounded-lg px-2 py-1 text-xs text-muted hover:text-destructive disabled:opacity-50"
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
