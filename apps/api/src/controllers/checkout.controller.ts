import type { Request, Response } from "express";
import {
  createCheckoutSession,
  setBuyNowIntent,
  getOrderByStripeSession,
  cancelPendingCheckoutOrder,
} from "../services/checkout.service";
import {
  ensureCartIdentity,
  persistCartSession,
} from "../utils/cart-identity";
import { sendSuccess } from "../utils/api-response";
import { AppError } from "../utils/app-error";

export async function createCheckoutHandler(req: Request, res: Response) {
  const identity = ensureCartIdentity(req, res);
  await persistCartSession(req);
  const result = await createCheckoutSession(
    identity,
    req.body,
    req.session.buyNow ?? null
  );

  if (req.body?.mode === "buy_now") {
    delete req.session.buyNow;
    await persistCartSession(req);
  }

  return sendSuccess(res, result, 201);
}

export async function buyNowHandler(req: Request, res: Response) {
  const identity = ensureCartIdentity(req, res);
  await persistCartSession(req);
  const intent = await setBuyNowIntent(identity, req.body);
  req.session.buyNow = {
    productId: intent.productId,
    variantId: intent.variantId,
    quantity: intent.quantity,
  };
  await persistCartSession(req);
  return sendSuccess(res, intent);
}

export async function getCheckoutSuccessHandler(req: Request, res: Response) {
  const sessionId = String(req.query.session_id ?? "");
  if (!sessionId) {
    throw new AppError(400, "SESSION_REQUIRED", "Stripe session id is required");
  }

  const order = await getOrderByStripeSession(sessionId);
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found for this session");
  }

  return sendSuccess(res, {
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    totals: order.totals,
    items: order.items,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    shippingMethod: order.shippingMethod,
    shippingAddress: order.shippingAddress,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
  });
}

export async function cancelCheckoutHandler(req: Request, res: Response) {
  const orderNumber = String(req.query.order ?? req.body?.orderNumber ?? "");
  if (orderNumber) {
    await cancelPendingCheckoutOrder(orderNumber);
  }
  return sendSuccess(res, { cancelled: true });
}
