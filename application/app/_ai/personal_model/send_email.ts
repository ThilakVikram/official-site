import nodemailer, { type Transporter } from "nodemailer";

// Sends contact requests from the assistant to the site owner over SMTP.
// Mail only ever goes to CONTACT_TO_EMAIL; the visitor's address is used as
// Reply-To, never as a recipient, so this can't be used to spam others.
//
// .env:
//   SMTP_HOST=smtp-relay.brevo.com   SMTP_PORT=587
//   SMTP_USER=...                    SMTP_PASS=...
//   SMTP_FROM="Portfolio <verified-sender@example.com>"   (defaults to SMTP_USER)
//   CONTACT_TO_EMAIL=you@example.com

export type ContactDetails = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  isRecruiter?: boolean;
  message: string;
};

export function isEmailConfigured() {
  const e = process.env;
  return !!(e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS && e.CONTACT_TO_EMAIL);
}

let transporter: Transporter | undefined;
function getTransporter() {
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendContactEmail(d: ContactDetails) {
  if (!isEmailConfigured()) throw new Error("SMTP is not configured");

  const rows: [string, string | undefined][] = [
    ["Name", d.name],
    ["Email", d.email],
    ["Phone", d.phone],
    ["Company", d.company],
    ["Recruiter", d.isRecruiter ? "Yes" : undefined],
  ];
  const filled = rows.filter((r): r is [string, string] => !!r[1]);

  const text = [...filled.map(([k, v]) => `${k}: ${v}`), "", d.message, "", "— Sent by the AI assistant on your portfolio"].join("\n");
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="margin:0 0 12px">New contact request</h2>
      <table style="border-collapse:collapse;margin-bottom:16px">
        ${filled.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><b>${escapeHtml(v)}</b></td></tr>`).join("")}
      </table>
      <p style="white-space:pre-wrap;padding:12px 16px;background:#f4f4f5;border-radius:8px">${escapeHtml(d.message)}</p>
      <p style="color:#999;font-size:12px">Sent by the AI assistant on your portfolio. Reply to this email to answer ${escapeHtml(d.name)} directly.</p>
    </div>`;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_TO_EMAIL,
    replyTo: { name: oneLine(d.name), address: d.email },
    subject: `Portfolio contact: ${oneLine(d.name)}${d.company ? ` (${oneLine(d.company)})` : ""}`,
    text,
    html,
  });
}
