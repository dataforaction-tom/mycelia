"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function SignInForm({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // Explicit callbackUrl: without it NextAuth defaults to the current
      // page (/sign-in), so a successful magic link would land users back
      // on the sign-in form and look like a failure. The page passes the
      // middleware-preserved destination (validated), defaulting to "/".
      await signIn("resend", { email, redirect: false, callbackUrl });
      setEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="text-center">
        <div className="bg-moss/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <svg
            className="text-moss h-6 w-6"
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
        <h3 className="text-bark text-lg font-semibold">Check your email</h3>
        <p className="text-muted mt-2 text-sm">
          We sent a magic link to <strong className="text-bark">{email}</strong>
          . Click it to sign in.
        </p>
        <button
          onClick={() => setEmailSent(false)}
          className="text-terracotta hover:text-terracotta-dark mt-4 text-sm"
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
            className="text-bark block text-sm font-medium"
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
            className="border-border text-bark placeholder:text-muted-light focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-terracotta hover:bg-terracotta-dark w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {isLoading ? "Sending link..." : "Send magic link"}
        </button>
        <p className="text-muted text-center text-xs">
          No passwords — we email you a link that signs you in.
        </p>
      </form>

      {/* Dev-only instant sign-in */}
      {process.env.NODE_ENV === "development" && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="border-border w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="text-muted bg-white px-2">dev only</span>
            </div>
          </div>
          <button
            onClick={() =>
              signIn("dev-login", {
                email: email || "tom@good-ship.co.uk",
                callbackUrl,
              })
            }
            className="border-amber bg-amber/5 text-bark hover:bg-amber/10 w-full rounded-lg border border-dashed px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Dev sign-in as {email || "tom@good-ship.co.uk"}
          </button>
        </>
      )}
    </div>
  );
}
