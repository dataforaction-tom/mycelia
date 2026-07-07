/**
 * Transactional email via the Resend REST API. Plain fetch, lazy env reads
 * (never at module level), no SDK dependency — mirrors the transcription
 * provider pattern. Callers other than the magic link should treat sends
 * as best-effort: an email failure must never fail the action it follows.
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.AUTH_RESEND_KEY);
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<string> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  if (!apiKey) {
    throw new Error("Email is not configured (AUTH_RESEND_KEY missing)");
  }

  const fromAddress = process.env.EMAIL_FROM ?? "noreply@tending.network";
  const from = fromAddress.includes("<")
    ? fromAddress
    : `Tending <${fromAddress}>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { id?: string };
  return data.id ?? "";
}
