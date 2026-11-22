import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../config/env";

export type CartIdentity = { userId?: string; guestId?: string };

/**
 * Resolve a stable cart identity for the request.
 * Prefer authenticated user, then session, cookie, then X-Guest-Id header.
 * Always re-assert the guest cookie so cross-origin SPA calls stay sticky.
 */
export function ensureCartIdentity(req: Request, res: Response): CartIdentity {
  if (req.auth?.userId) {
    return { userId: req.auth.userId };
  }

  const headerGuest =
    typeof req.headers["x-guest-id"] === "string"
      ? req.headers["x-guest-id"].trim()
      : "";

  let guestId =
    req.session.guestId ||
    req.cookies?.ookf_guest ||
    (headerGuest || undefined);

  if (!guestId) {
    guestId = randomUUID();
  }

  req.session.guestId = guestId;
  res.cookie("ookf_guest", guestId, {
    httpOnly: true,
    path: "/",
    sameSite: env.isProd ? "none" : "lax",
    secure: env.cookieSecure,
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  // Expose guest id so the browser can echo it via X-Guest-Id when cookies
  // are blocked (e.g. some LAN / cross-site setups).
  res.setHeader("X-Guest-Id", guestId);
  res.setHeader("Access-Control-Expose-Headers", "X-Guest-Id");

  return { guestId };
}

export async function persistCartSession(req: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}
