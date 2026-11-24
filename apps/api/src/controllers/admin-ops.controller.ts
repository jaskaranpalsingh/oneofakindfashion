import type { Request, Response } from "express";
import {
  getCustomerById,
  listCustomers,
  processCustomerDeletion,
  sendCustomerPasswordReset,
  updateCustomerAdmin,
} from "../services/admin-customers.service";
import {
  adjustInventory,
  listInventory,
  listInventoryAdjustments,
} from "../services/admin-inventory.service";
import {
  archiveCoupon,
  createCoupon,
  duplicateCoupon,
  getCouponStats,
  listCoupons,
  updateCoupon,
} from "../services/admin-coupons.service";
import {
  getStoreSettings,
  updateStoreSettings,
} from "../services/admin-settings.service";
import { sendSuccess } from "../utils/api-response";

export async function listCustomersHandler(req: Request, res: Response) {
  const status =
    req.query.status === "active" || req.query.status === "disabled"
      ? req.query.status
      : "all";
  const data = await listCustomers({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    limit: Number(req.query.limit ?? 50),
    page: Number(req.query.page ?? 1),
    status,
  });
  return sendSuccess(res, data);
}

export async function getCustomerHandler(req: Request, res: Response) {
  const data = await getCustomerById(req.params.id);
  return sendSuccess(res, data);
}

export async function patchCustomerHandler(req: Request, res: Response) {
  const data = await updateCustomerAdmin(req.params.id, {
    isActive:
      req.body?.isActive === undefined
        ? undefined
        : Boolean(req.body.isActive),
    firstName:
      typeof req.body?.firstName === "string" ? req.body.firstName : undefined,
    lastName:
      typeof req.body?.lastName === "string" ? req.body.lastName : undefined,
    phone:
      req.body?.phone === null || typeof req.body?.phone === "string"
        ? req.body.phone
        : undefined,
    internalNotes:
      typeof req.body?.internalNotes === "string"
        ? req.body.internalNotes
        : undefined,
  });
  return sendSuccess(res, data);
}

export async function sendCustomerResetHandler(req: Request, res: Response) {
  const data = await sendCustomerPasswordReset(req.params.id);
  return sendSuccess(res, data);
}

export async function processCustomerDeletionHandler(
  req: Request,
  res: Response
) {
  const data = await processCustomerDeletion(req.params.id);
  return sendSuccess(res, data);
}

export async function listInventoryHandler(req: Request, res: Response) {
  const data = await listInventory({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
  });
  return sendSuccess(res, data);
}

export async function adjustInventoryHandler(req: Request, res: Response) {
  const mode =
    req.body?.mode === "set" ||
    req.body?.mode === "add" ||
    req.body?.mode === "remove"
      ? (req.body.mode as "set" | "add" | "remove")
      : undefined;

  const data = await adjustInventory({
    productId: String(req.body?.productId ?? ""),
    variantId: String(req.body?.variantId ?? ""),
    quantityDelta:
      req.body?.quantityDelta !== undefined
        ? Number(req.body.quantityDelta)
        : undefined,
    mode,
    quantity:
      req.body?.quantity !== undefined ? Number(req.body.quantity) : undefined,
    reason:
      typeof req.body?.reason === "string" ? req.body.reason : undefined,
    type: typeof req.body?.type === "string" ? req.body.type : undefined,
    actorUserId: req.auth?.userId,
  });
  return sendSuccess(res, data);
}

export async function listInventoryAdjustmentsHandler(
  req: Request,
  res: Response
) {
  const data = await listInventoryAdjustments({
    limit: Number(req.query.limit ?? 30),
    productId:
      typeof req.query.productId === "string" ? req.query.productId : undefined,
    variantId:
      typeof req.query.variantId === "string" ? req.query.variantId : undefined,
  });
  return sendSuccess(res, data);
}

export async function listCouponsHandler(req: Request, res: Response) {
  const data = await listCoupons({
    includeArchived: req.query.includeArchived === "1",
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    type: typeof req.query.type === "string" ? req.query.type : undefined,
    q: typeof req.query.q === "string" ? req.query.q : undefined,
  });
  return sendSuccess(res, data);
}

export async function couponStatsHandler(_req: Request, res: Response) {
  const data = await getCouponStats();
  return sendSuccess(res, data);
}

export async function createCouponHandler(req: Request, res: Response) {
  const data = await createCoupon(req.body);
  return sendSuccess(res, data, 201);
}

export async function updateCouponHandler(req: Request, res: Response) {
  const data = await updateCoupon(req.params.id, req.body);
  return sendSuccess(res, data);
}

export async function duplicateCouponHandler(req: Request, res: Response) {
  const data = await duplicateCoupon(req.params.id);
  return sendSuccess(res, data, 201);
}

export async function archiveCouponHandler(req: Request, res: Response) {
  const data = await archiveCoupon(req.params.id);
  return sendSuccess(res, data);
}

export async function getSettingsHandler(_req: Request, res: Response) {
  const data = await getStoreSettings();
  return sendSuccess(res, data);
}

export async function updateSettingsHandler(req: Request, res: Response) {
  const data = await updateStoreSettings(req.body ?? {});
  return sendSuccess(res, data);
}
