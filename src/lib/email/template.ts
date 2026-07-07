/**
 * The Tending email template: the app's two-worlds identity translated to
 * email's constraints — table layout, inline styles, no SVG or webfonts.
 * Parchment outer, white card, dark soil header band with a serif cream
 * wordmark (Georgia stands in for Gloock), moss/green pill button.
 */

export interface EmailCta {
  label: string;
  url: string;
}

export interface RenderEmailInput {
  /** Hidden preview line shown by inbox list views. */
  preheader: string;
  heading: string;
  paragraphs: string[];
  cta?: EmailCta;
  /** Small muted line under the button (e.g. expiry notes). */
  footerNote?: string;
}

const COLOURS = {
  parchment: "#f6efdf",
  card: "#ffffff",
  soil: "#271d11",
  ink: "#33291a",
  body: "#4c4028",
  muted: "#988a66",
  cream: "#f0eedd",
  creamSoft: "#bfad8e",
  green: "#6f9a4f",
  border: "#e9e0cc",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderEmail({
  preheader,
  heading,
  paragraphs,
  cta,
  footerNote,
}: RenderEmailInput): { html: string; text: string } {
  const paragraphHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;font-family:Verdana,Geneva,sans-serif;font-size:15px;line-height:1.65;color:${COLOURS.body};">${escapeHtml(p)}</p>`,
    )
    .join("\n");

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px 0;">
        <tr>
          <td style="border-radius:999px;background:${COLOURS.green};">
            <a href="${cta.url}" style="display:inline-block;padding:13px 30px;font-family:Verdana,Geneva,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>`
    : "";

  const footerNoteHtml = footerNote
    ? `<p style="margin:14px 0 0 0;font-family:Verdana,Geneva,sans-serif;font-size:12px;line-height:1.6;color:${COLOURS.muted};">${escapeHtml(footerNote)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLOURS.parchment};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOURS.parchment};">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Soil header band -->
          <tr>
            <td style="background-color:${COLOURS.soil};border-radius:18px 18px 0 0;padding:28px 36px 24px 36px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:30px;color:${COLOURS.cream};">tending</span>
              <br>
              <span style="font-family:Verdana,Geneva,sans-serif;font-size:10px;letter-spacing:3px;color:${COLOURS.creamSoft};">RELATIONSHIPS ARE LIVING THINGS</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:${COLOURS.card};border-radius:0 0 18px 18px;padding:34px 36px 30px 36px;border:1px solid ${COLOURS.border};border-top:none;">
              <h1 style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;line-height:1.25;color:${COLOURS.ink};">${escapeHtml(heading)}</h1>
              ${paragraphHtml}
              ${ctaHtml}
              ${footerNoteHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:22px 36px;">
              <p style="margin:0;font-family:Verdana,Geneva,sans-serif;font-size:12px;line-height:1.6;color:${COLOURS.muted};">
                <span style="font-family:Georgia,serif;font-size:14px;color:${COLOURS.body};">tending</span>
                &nbsp;&middot;&nbsp; relationships are living things
                &nbsp;&middot;&nbsp; <a href="https://tending.network" style="color:${COLOURS.muted};">tending.network</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    heading,
    "",
    ...paragraphs,
    ...(cta ? ["", `${cta.label}: ${cta.url}`] : []),
    ...(footerNote ? ["", footerNote] : []),
    "",
    "tending · relationships are living things · https://tending.network",
  ].join("\n");

  return { html, text };
}
