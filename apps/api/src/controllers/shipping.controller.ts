import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import {
  deleteShippingMethod,
  deleteShippingZone,
  getPublicShippingConfig,
  listShippingMethods,
  listShippingZones,
  upsertShippingMethod,
  upsertShippingZone,
} from "../services/shipping.service";

export async function listAdminShippingMethodsHandler(
  _req: Request,
  res: Response
) {
  const data = await listShippingMethods();
  return sendSuccess(res, data);
}

export async function upsertShippingMethodHandler(req: Request, res: Response) {
  const data = await upsertShippingMethod({
    id: typeof req.body.id === "string" ? req.body.id : undefined,
    code: String(req.body.code ?? ""),
    name: String(req.body.name ?? ""),
    description:
      typeof req.body.description === "string" ? req.body.description : "",
    baseRateCents: Number(req.body.baseRateCents ?? 0),
    etaLabel: typeof req.body.etaLabel === "string" ? req.body.etaLabel : "",
    isPickup: Boolean(req.body.isPickup),
    qualifiesForFreeShipping: Boolean(req.body.qualifiesForFreeShipping),
    isActive: req.body.isActive !== false,
    sortOrder: Number(req.body.sortOrder ?? 0),
  });
  return sendSuccess(res, data);
}

export async function deleteShippingMethodHandler(req: Request, res: Response) {
  const data = await deleteShippingMethod(String(req.params.id));
  return sendSuccess(res, data);
}

export async function listAdminShippingZonesHandler(
  _req: Request,
  res: Response
) {
  const data = await listShippingZones();
  return sendSuccess(res, data);
}

export async function upsertShippingZoneHandler(req: Request, res: Response) {
  const data = await upsertShippingZone({
    id: typeof req.body.id === "string" ? req.body.id : undefined,
    key: String(req.body.key ?? ""),
    name: String(req.body.name ?? ""),
    provinces: Array.isArray(req.body.provinces) ? req.body.provinces : [],
    postalPrefixes: Array.isArray(req.body.postalPrefixes)
      ? req.body.postalPrefixes
      : [],
    isRemote: Boolean(req.body.isRemote),
    remoteSurchargeCents: Number(req.body.remoteSurchargeCents ?? 0),
    rates: Array.isArray(req.body.rates) ? req.body.rates : [],
    isActive: req.body.isActive !== false,
    sortOrder: Number(req.body.sortOrder ?? 0),
  });
  return sendSuccess(res, data);
}

export async function deleteShippingZoneHandler(req: Request, res: Response) {
  const data = await deleteShippingZone(String(req.params.id));
  return sendSuccess(res, data);
}

export async function publicShippingConfigHandler(
  _req: Request,
  res: Response
) {
  const data = await getPublicShippingConfig();
  return sendSuccess(res, data);
}
