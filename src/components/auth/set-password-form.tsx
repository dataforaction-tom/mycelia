"use client";

import { useState } from "react";

export function SetPasswordForm({
  hasPassword,
  recoveryMode = false,
}: {
  hasPassword: boolean;
  /** Just proved ownership via a fresh magic-link sign-in — skip asking for
   *  the old password even though one is already set. */
  recoveryMode?: boolean;
}) {
  const requireCurrentPassword = hasPassword && !recoveryMode;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/account/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: requireCurrentPassword ? currentPassword : undefined,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-moss/30 bg-moss/10 p-3 text-sm text-bark"
        >
          {hasPassword
            ? "Password updated."
            : "Password set — you can now sign in with either your password or a magic link."}
        </div>
      )}

      {requireCurrentPassword && (
        <div>
          <label
            htmlFor="currentPassword"
            className="text-bark block text-sm font-medium"
          >
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="border-border text-bark placeholder:text-muted-light focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
          />
        </div>
      )}

      <div>
        <label htmlFor="newPassword" className="text-bark block text-sm font-medium">
          {hasPassword ? "New password" : "Password"}
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          minLength={8}
          className="border-border text-bark placeholder:text-muted-light focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-terracotta hover:bg-terracotta-dark w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 sm:w-auto"
      >
        {isSubmitting
          ? "Saving..."
          : requireCurrentPassword
            ? "Change password"
            : hasPassword
              ? "Set new password"
              : "Set password"}
      </button>
    </form>
  );
}
