import type { Request, Response } from "express";
import {
  addWishlistItem,
  createAddress,
  deleteAddress,
  getAccountOverview,
  getCheckoutProfile,
  getWishlist,
  listAddresses,
  removeWishlistItem,
  syncWishlist,
  updateAddress,
} from "../services/account.service";
import { sendSuccess } from "../utils/api-response";
import { AppError } from "../utils/app-error";

function requireUserId(req: Request) {
  if (!req.auth?.userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }
  return req.auth.userId;
}

export async function accountOverviewHandler(req: Request, res: Response) {
  const data = await getAccountOverview(requireUserId(req));
  return sendSuccess(res, data);
}

export async function listAddressesHandler(req: Request, res: Response) {
  const data = await listAddresses(requireUserId(req));
  return sendSuccess(res, data);
}

export async function createAddressHandler(req: Request, res: Response) {
  const data = await createAddress(requireUserId(req), req.body);
  return sendSuccess(res, data, 201);
}

export async function updateAddressHandler(req: Request, res: Response) {
  const data = await updateAddress(
    requireUserId(req),
    req.params.id,
    req.body
  );
  return sendSuccess(res, data);
}

export async function deleteAddressHandler(req: Request, res: Response) {
  const data = await deleteAddress(requireUserId(req), req.params.id);
  return sendSuccess(res, data);
}

export async function wishlistHandler(req: Request, res: Response) {
  const data = await getWishlist(requireUserId(req));
  return sendSuccess(res, data);
}

export async function addWishlistHandler(req: Request, res: Response) {
  const productId =
    typeof req.body?.productId === "string" ? req.body.productId : "";
  const data = await addWishlistItem(requireUserId(req), productId);
  return sendSuccess(res, data);
}

export async function removeWishlistHandler(req: Request, res: Response) {
  const data = await removeWishlistItem(requireUserId(req), req.params.productId);
  return sendSuccess(res, data);
}

export async function syncWishlistHandler(req: Request, res: Response) {
  const productIds = Array.isArray(req.body?.productIds)
    ? (req.body.productIds as unknown[]).filter(
        (id): id is string => typeof id === "string"
      )
    : [];
  const data = await syncWishlist(requireUserId(req), productIds);
  return sendSuccess(res, data);
}

export async function checkoutProfileHandler(req: Request, res: Response) {
  const data = await getCheckoutProfile(requireUserId(req));
  return sendSuccess(res, data);
}
