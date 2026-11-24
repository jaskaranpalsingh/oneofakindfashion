import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  authenticateUser,
  changePassword,
  getUserById,
  registerCustomer,
  requestAccountDeletion,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  updateProfile,
  verifyEmail,
} from "../services/auth.service";
import { claimGuestOrdersForUser } from "../services/customer-order.service";
import { sendSuccess, setPrivateNoStore } from "../utils/api-response";
import { AppError } from "../utils/app-error";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts. Please try again later.",
    },
  },
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many password reset attempts. Please try again later.",
    },
  },
});

function applyRememberMe(req: Request, rememberMe: boolean) {
  if (!req.session.cookie) return;
  req.session.cookie.maxAge = rememberMe
    ? 1000 * 60 * 60 * 24 * 30
    : 1000 * 60 * 60 * 24 * 14;
}

async function persistSession(
  req: Request,
  user: {
    id: string;
    role: "customer" | "admin";
    adminRole?: "owner" | "manager" | "staff";
  },
  rememberMe = false
) {
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.adminRole = user.adminRole;
  applyRememberMe(req, rememberMe);
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

export async function registerHandler(req: Request, res: Response) {
  const user = await registerCustomer(req.body);
  await persistSession(req, user, false);
  await claimGuestOrdersForUser(user.id, user.email);
  return sendSuccess(res, { user }, 201);
}

export async function loginHandler(req: Request, res: Response) {
  const { user, rememberMe } = await authenticateUser(req.body);
  await persistSession(req, user, rememberMe);
  await claimGuestOrdersForUser(user.id, user.email);
  return sendSuccess(res, { user });
}

export async function logoutHandler(req: Request, res: Response) {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  res.clearCookie(process.env.COOKIE_NAME ?? "ookf_session");
  return sendSuccess(res, { loggedOut: true });
}

export async function meHandler(req: Request, res: Response) {
  setPrivateNoStore(res);
  if (!req.session.userId) {
    return sendSuccess(res, { user: null });
  }

  const user = await getUserById(req.session.userId);
  if (!user) {
    return sendSuccess(res, { user: null });
  }

  return sendSuccess(res, { user });
}

export async function updateProfileHandler(req: Request, res: Response) {
  if (!req.auth?.userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }
  const user = await updateProfile(req.auth.userId, req.body);
  return sendSuccess(res, { user });
}

export async function changePasswordHandler(req: Request, res: Response) {
  if (!req.auth?.userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }
  const result = await changePassword(req.auth.userId, req.body);
  return sendSuccess(res, result);
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const result = await requestPasswordReset(req.body);
  return sendSuccess(res, result);
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const result = await resetPassword(req.body);
  return sendSuccess(res, result);
}

export async function verifyEmailHandler(req: Request, res: Response) {
  const user = await verifyEmail(req.body);
  if (req.session.userId === user.id || !req.session.userId) {
    await persistSession(req, user, false);
  }
  await claimGuestOrdersForUser(user.id, user.email);
  return sendSuccess(res, { user });
}

export async function resendVerificationHandler(req: Request, res: Response) {
  if (!req.auth?.userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }
  const result = await resendVerificationEmail(req.auth.userId);
  return sendSuccess(res, result);
}

export async function requestDeletionHandler(req: Request, res: Response) {
  if (!req.auth?.userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }
  const result = await requestAccountDeletion(req.auth.userId);
  return sendSuccess(res, result);
}
