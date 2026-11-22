import type { NextFunction, Request, Response } from "express";
import { getUserById } from "../services/auth.service";
import { sendError } from "../utils/api-response";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: "customer" | "admin";
        adminRole?: "owner" | "manager" | "staff";
      };
    }
  }
}

export async function hydrateAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    if (req.session?.userId) {
      const user = await getUserById(req.session.userId);
      if (user) {
        req.auth = {
          userId: user.id,
          role: user.role,
          adminRole: user.adminRole,
        };
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.auth?.userId) {
    return sendError(res, 401, "UNAUTHENTICATED", "Authentication required");
  }
  return next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.auth?.role === "admin") {
    return next();
  }

  return sendError(
    res,
    401,
    "ADMIN_AUTH_REQUIRED",
    "Admin authentication is required."
  );
}
