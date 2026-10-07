export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
export function emailTemplate(kind: "account_created" | "password_reset" | "card_suspended", name: string, link?: string) {
  const subject = kind === "account_created" ? "Set your SU Card password" : kind === "password_reset" ? "Reset your SU Card password" : "Your SU Card is suspended";
  const message = kind === "account_created" ? "Your SU Card account is ready. Set your password using the link below." :
    kind === "password_reset" ? "Use the link below to reset your SU Card password. If you did not request this, ignore this email." :
    "Your SU Card has been suspended. Contact the Student Union for help.";
  const base = process.env.PUBLIC_BASE_URL ?? process.env.BETTER_AUTH_URL ?? "";
  const logo = new URL("/brand/su-logo-white@hd.png", base || "https://sucard.local").href;
  const html = `<div style="font-family:Poppins,Arial,sans-serif;color:#0F3056;max-width:600px;margin:auto"><div style="background:#0F3056;padding:24px"><img src="${escapeHtml(logo)}" alt="SU Card" style="max-width:160px"></div><div style="padding:24px"><h1 style="font-size:24px">${escapeHtml(subject)}</h1><p>Hello ${escapeHtml(name)},</p><p>${escapeHtml(message)}</p>${link ? `<p><a href="${escapeHtml(link)}" style="color:#0F548D">${kind === "account_created" ? "Set password" : "Reset password"}</a></p>` : ""}<p>Student Union, Nile University</p></div></div>`;
  const text = `Hello ${name},\n\n${message}${link ? `\n\n${link}` : ""}\n\nStudent Union, Nile University`;
  return { subject, html, text };
}
