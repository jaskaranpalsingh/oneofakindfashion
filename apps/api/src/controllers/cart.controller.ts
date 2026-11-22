import type { Request, Response } from "express";
import { z } from "zod";
import {
  addToCart,
  applyCoupon,
  getCart,
  mergeGuestCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from "../services/cart.service";
import {
  ensureCartIdentity,
  persistCartSession,
} from "../utils/cart-identity";
import { sendSuccess } from "../utils/api-response";

export async function getCartHandler(req: Request, res: Response) {
  const identity = ensureCartIdentity(req, res);
  await persistCartSession(req);
  const cart = await getCart(identity);
  return sendSuccess(res, { ...cart, guestId: identity.guestId ?? null });
}

export async function addCartItemHandler(req: Request, res: Response) {
  const identity = ensureCartIdentity(req, res);
  await persistCartSession(req);
  const cart = await addToCart(identity, req.body);
  return sendSuccess(res, { ...cart, guestId: identity.guestId ?? null });
}

export async function updateCartItemHandler(req: Request, res: Response) {
  const identity = ensureCartIdentity(req, res);
  await persistCartSession(req);
  const quantity = z.coerce
    .number()
    .int()
    .min(1)
    .max(99)
    .parse(req.body.quantity);
  const cart = await updateCartItem(identity, req.params.itemId, quantity);
  return sendSuccess(res, { ...cart, guestId: identity.guestId ?? null });
}

export async function removeCartItemHandler(req: Request, res: Response) {
  const identity = ensureCartIdentity(req, res);
  await persistCartSession(req);
  const cart = await removeCartItem(identity, req.params.itemId);
  return sendSuccess(res, { ...cart, guestId: identity.guestId ?? null });
}

export async function applyCouponHandler(req: Request, res: Response) {
  const identity = ensureCartIdentity(req, res);
  await persistCartSession(req);
  const code = z.string().trim().min(1).parse(req.body.code);
  const cart = await applyCoupon(identity, code);
  return sendSuccess(res, { ...cart, guestId: identity.guestId ?? null });
}

export async function removeCouponHandler(req: Request, res: Response) {
  const identity = ensureCartIdentity(req, res);
  await persistCartSession(req);
  const cart = await removeCoupon(identity);
  return sendSuccess(res, { ...cart, guestId: identity.guestId ?? null });
}

export async function mergeCartHandler(req: Request, res: Response) {
  if (!req.auth?.userId) {
    const identity = ensureCartIdentity(req, res);
    await persistCartSession(req);
    return sendSuccess(res, {
      ...(await getCart(identity)),
      guestId: identity.guestId ?? null,
    });
  }
  const guestId =
    req.session.guestId ??
    req.cookies?.ookf_guest ??
    (typeof req.headers["x-guest-id"] === "string"
      ? req.headers["x-guest-id"]
      : undefined);
  const cart = await mergeGuestCart(req.auth.userId, guestId);
  return sendSuccess(res, { ...cart, guestId: null });
}
