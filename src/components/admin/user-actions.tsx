"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserActionsProps {
  userId: string;
  email: string;
  status: "active" | "suspended";
  isSelf: boolean;
}

type Notice = { kind: "ok" | "error"; message: string } | null;

export function UserActions({ userId, email, status, isSelf }: UserActionsProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState<string | null>(null);

  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  async function call(
    path: string,
    method: "POST" | "DELETE",
    body?: Record<string, unknown>,
  ): Promise<boolean> {
    setPending(path);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}${path}`, {
        method,
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setNotice({ kind: "error", message: json.error ?? "Something went wrong" });
        return false;
      }
      return true;
    } catch {
      setNotice({ kind: "error", message: "Network error — please retry" });
      return false;
    } finally {
      setPending(null);
    }
  }

  async function resendLink() {
    if (await call("/resend-magic-link", "POST")) {
      setNotice({ kind: "ok", message: `Sign-in link sent to ${email}.` });
    }
  }

  async function forceSignout() {
    if (!confirm("Sign this user out of all sessions?")) return;
    if (await call("/force-signout", "POST")) {
      setNotice({ kind: "ok", message: "User signed out of all sessions." });
    }
  }

  async function toggleSuspend() {
    const suspend = status === "active";
    if (
      !confirm(
        suspend
          ? "Suspend this user? They'll be signed out and blocked from signing in."
          : "Reactivate this user?",
      )
    )
      return;
    if (await call("/suspend", "POST", { suspend })) {
      router.refresh();
    }
  }

  async function changeEmail() {
    if (await call("/change-email", "POST", { email: newEmail })) {
      setEmailOpen(false);
      setNewEmail("");
      setNotice({ kind: "ok", message: `Email changed to ${newEmail}.` });
      router.refresh();
    }
  }

  async function deleteUser() {
    if (await call("", "DELETE", { confirmEmail })) {
      router.push("/admin/users");
    }
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div
          className={
            notice.kind === "ok"
              ? "rounded-lg border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-bark"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {notice.message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={resendLink} disabled={pending !== null}>
          Resend magic link
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)} disabled={pending !== null}>
          Change email
        </Button>
        <Button variant="outline" size="sm" onClick={forceSignout} disabled={pending !== null}>
          Force sign-out
        </Button>
        <Button
          variant={status === "active" ? "secondary" : "outline"}
          size="sm"
          onClick={toggleSuspend}
          disabled={pending !== null || isSelf}
          title={isSelf ? "You cannot suspend your own account" : undefined}
        >
          {status === "active" ? "Suspend" : "Reactivate"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          disabled={pending !== null || isSelf}
          title={isSelf ? "You cannot delete your own account" : undefined}
        >
          Delete
        </Button>
      </div>

      {/* Change email */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change email</DialogTitle>
            <DialogDescription>
              This is the identity used for magic-link sign-in. The user will be
              signed out and both addresses notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-email">New email</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="new@example.com"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={changeEmail}
              disabled={pending !== null || !newEmail.includes("@")}
            >
              Change email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              This permanently removes the account and its memberships. Authored
              moments are kept but detached. Type <strong>{email}</strong> to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-email">Confirm email</Label>
            <Input
              id="confirm-email"
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              placeholder={email}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteUser}
              disabled={
                pending !== null ||
                confirmEmail.trim().toLowerCase() !== email.toLowerCase()
              }
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
