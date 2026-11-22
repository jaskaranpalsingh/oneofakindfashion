import type { Request, Response } from "express";
import {
  getOrderById,
  listOrders,
  updateOrderFulfillment,
} from "../services/order.service";
import { sendSuccess } from "../utils/api-response";

export async function listOrdersHandler(req: Request, res: Response) {
  const orders = await listOrders({
    limit: Number(req.query.limit ?? 50),
    paymentStatus:
      typeof req.query.paymentStatus === "string"
        ? req.query.paymentStatus
        : undefined,
    fulfillmentStatus:
      typeof req.query.fulfillmentStatus === "string"
        ? req.query.fulfillmentStatus
        : undefined,
    q: typeof req.query.q === "string" ? req.query.q : undefined,
  });
  return sendSuccess(res, orders);
}

export async function getOrderHandler(req: Request, res: Response) {
  const order = await getOrderById(req.params.id);
  return sendSuccess(res, order);
}

export async function updateOrderFulfillmentHandler(
  req: Request,
  res: Response
) {
  const order = await updateOrderFulfillment(
    req.params.id,
    {
      fulfillmentStatus: req.body?.fulfillmentStatus,
      trackingNumber: req.body?.trackingNumber,
      shippingCarrier: req.body?.shippingCarrier,
      internalNotes: req.body?.internalNotes,
    },
    req.auth?.userId
  );
  return sendSuccess(res, order);
}
