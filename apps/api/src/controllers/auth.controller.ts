import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  authenticateUser,
  getUserById,
  registerCustomer,
} from "../services/auth.service";
import { sendSuccess } from "../utils/api-response";

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

export async function registerHandler(req: Request, res: Response) {
  const user = await registerCustomer(req.body);
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.adminRole = user.adminRole;
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
  return sendSuccess(res, { user }, 201);
}

export async function loginHandler(req: Request, res: Response) {
  const user = await authenticateUser(req.body);
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.adminRole = user.adminRole;
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
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
  // Guest-friendly session probe: 200 + user null avoids noisy browser 401s.
  if (!req.session.userId) {
    return sendSuccess(res, { user: null });
  }

  const user = await getUserById(req.session.userId);
  if (!user) {
    return sendSuccess(res, { user: null });
  }

  return sendSuccess(res, { user });
}
