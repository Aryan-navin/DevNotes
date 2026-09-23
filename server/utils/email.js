const nodemailer = require("nodemailer");

function createTransport() {
  const host = String(process.env.EMAIL_HOST || "").trim();
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = String(process.env.EMAIL_USER || "").trim();
  const pass = String(process.env.EMAIL_PASSWORD || "");

  if (!host || !user || !pass) {
    throw new Error("Password reset email is not configured. Set EMAIL_HOST, EMAIL_USER and EMAIL_PASSWORD in the server environment.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true",
    auth: { user, pass }
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl, expiresMinutes }) {
  const from = String(process.env.EMAIL_FROM || process.env.EMAIL_USER || "").trim();
  if (!from) throw new Error("EMAIL_FROM or EMAIL_USER must be configured.");

  const transporter = createTransport();
  const safeName = String(name || "there").replace(/[<>]/g, "");
  const appName = "DevNotes";

  await transporter.sendMail({
    from: `DevNotes <${from}>`,
    to,
    subject: "Reset your DevNotes password",
    text: `Hi ${safeName},\n\nWe received a request to reset your DevNotes password. Use this link within ${expiresMinutes} minutes:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<!doctype html><html><body style="margin:0;background:#0b1020;font-family:Arial,sans-serif;color:#e8ecf8;padding:32px"><div style="max-width:560px;margin:auto;background:#12192b;border:1px solid #28334d;border-radius:18px;padding:32px"><h1 style="margin:0 0 8px;color:#fff">Reset your DevNotes password</h1><p style="color:#aebbd3;line-height:1.7">Hi ${safeName}, we received a request to reset your DevNotes password.</p><p style="color:#aebbd3;line-height:1.7">This link expires in ${expiresMinutes} minutes.</p><p><a href="${resetUrl}" style="display:inline-block;background:#7048f5;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px">Reset password</a></p><p style="color:#7f8da8;font-size:13px;line-height:1.6">If you did not request this, you can safely ignore this email.</p></div></body></html>`
  });
}

module.exports = { sendPasswordResetEmail };
