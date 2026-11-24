import { env } from "../config/env";
import { logger } from "../utils/logger";

async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  logKey: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!env.integrations.emailConfigured) {
    logger.warn(`${input.logKey} skipped — email provider not configured`, {
      to: input.to,
    });
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_PROVIDER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error(`${input.logKey} failed`, {
      status: response.status,
      body,
      to: input.to,
    });
    return { sent: false, reason: "EMAIL_PROVIDER_ERROR" };
  }

  logger.info(`${input.logKey} sent`, { to: input.to });
  return { sent: true };
}

function shell(title: string, body: string) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FAF7F0;font-family:Georgia,serif;color:#202820">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #E5DFD4">
    <div style="background:#003F2D;color:#fff;padding:28px 24px">
      <p style="margin:0;letter-spacing:0.2em;font-size:11px;color:#C49A36;font-family:sans-serif">ONE OF A KIND FASHION</p>
      <h1 style="margin:12px 0 0;font-weight:400;font-size:26px">${title}</h1>
    </div>
    <div style="padding:24px;font-family:sans-serif;font-size:14px;line-height:1.6;color:#4A453C">${body}</div>
  </div>
</body></html>`;
}

export async function sendEmailVerificationEmail(input: {
  to: string;
  firstName: string;
  verifyUrl: string;
}) {
  return sendTransactionalEmail({
    to: input.to,
    subject: "Verify your email · ONE OF A KIND FASHION",
    logKey: "Email verification",
    html: shell(
      "Verify your email",
      `<p>Hi ${input.firstName},</p>
       <p>Please confirm your email address to secure your account.</p>
       <p><a href="${input.verifyUrl}" style="display:inline-block;background:#003F2D;color:#FFF9EF;padding:12px 18px;text-decoration:none;letter-spacing:0.08em;font-size:12px;text-transform:uppercase">Verify email</a></p>
       <p style="font-size:12px;color:#6B6458">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>`
    ),
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  firstName: string;
  resetUrl: string;
}) {
  return sendTransactionalEmail({
    to: input.to,
    subject: "Reset your password · ONE OF A KIND FASHION",
    logKey: "Password reset",
    html: shell(
      "Reset your password",
      `<p>Hi ${input.firstName},</p>
       <p>We received a request to reset your password.</p>
       <p><a href="${input.resetUrl}" style="display:inline-block;background:#003F2D;color:#FFF9EF;padding:12px 18px;text-decoration:none;letter-spacing:0.08em;font-size:12px;text-transform:uppercase">Reset password</a></p>
       <p style="font-size:12px;color:#6B6458">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>`
    ),
  });
}
