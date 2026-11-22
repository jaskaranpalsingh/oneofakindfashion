import type { Request, Response } from "express";
import {
  getCustomerById,
  listCustomers,
  setCustomerActive,
} from "../services/admin-customers.service";
import {
  adjustInventory,
  listInventory,
  listInventoryAdjustments,
} from "../services/admin-inventory.service";
import {
  createCoupon,
  listCoupons,
  updateCoupon,
} from "../services/admin-coupons.service";
import {
  getStoreSettings,
  updateStoreSettings,
} from "../services/admin-settings.service";
import { sendSuccess } from "../utils/api-response";

export async function listCustomersHandler(req: Request, res: Response) {
  const data = await listCustomers({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    limit: Number(req.query.limit ?? 50),
  });
  return sendSuccess(res, data);
}

export async function getCustomerHandler(req: Request, res: Response) {
  const data = await getCustomerById(req.params.id);
  return sendSuccess(res, data);
}

export async function patchCustomerHandler(req: Request, res: Response) {
  const data = await setCustomerActive(
    req.params.id,
    Boolean(req.body?.isActive)
  );
  return sendSuccess(res, data);
}

export async function listInventoryHandler(req: Request, res: Response) {
  const data = await listInventory({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
  });
  return sendSuccess(res, data);
}

export async function adjustInventoryHandler(req: Request, res: Response) {
  const data = await adjustInventory({
    productId: String(req.body?.productId ?? ""),
    variantId: String(req.body?.variantId ?? ""),
    quantityDelta: Number(req.body?.quantityDelta),
    reason:
      typeof req.body?.reason === "string" ? req.body.reason : undefined,
    actorUserId: req.auth?.userId,
  });
  return sendSuccess(res, data);
}

export async function listInventoryAdjustmentsHandler(
  req: Request,
  res: Response
) {
  const data = await listInventoryAdjustments(Number(req.query.limit ?? 30));
  return sendSuccess(res, data);
}

export async function listCouponsHandler(_req: Request, res: Response) {
  const data = await listCoupons();
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

export async function getSettingsHandler(_req: Request, res: Response) {
  const data = await getStoreSettings();
  return sendSuccess(res, data);
}

export async function updateSettingsHandler(req: Request, res: Response) {
  const data = await updateStoreSettings(req.body ?? {});
  return sendSuccess(res, data);
}
