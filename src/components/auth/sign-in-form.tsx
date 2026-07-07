"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await signIn("resend", { email, redirect: false });
      setEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-moss/10">
          <svg
            className="h-6 w-6 text-moss"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-bark">Check your email</h3>
        <p className="mt-2 text-sm text-muted">
          We sent a magic link to <strong className="text-bark">{email}</strong>.
          Click it to sign in.
        </p>
        <button
          onClick={() => setEmailSent(false)}
          className="mt-4 text-sm text-terracotta hover:text-terracotta-dark"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email magic link — the one way in */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-bark"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
        >
          {isLoading ? "Sending link..." : "Send magic link"}
        </button>
        <p className="text-center text-xs text-muted">
          No passwords — we email you a link that signs you in.
        </p>
      </form>

      {/* Dev-only instant sign-in */}
      {process.env.NODE_ENV === "development" && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted">dev only</span>
            </div>
          </div>
          <button
            onClick={() =>
              signIn("dev-login", {
                email: email || "tom@good-ship.co.uk",
                callbackUrl: "/",
              })
            }
            className="w-full rounded-lg border border-dashed border-amber bg-amber/5 px-4 py-2.5 text-sm font-medium text-bark transition-colors hover:bg-amber/10"
          >
            Dev sign-in as {email || "tom@good-ship.co.uk"}
          </button>
        </>
      )}
    </div>
  );
}
