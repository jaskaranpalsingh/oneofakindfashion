import { Types } from "mongoose";
import { OrderModel } from "../models/order.model";
import { AppError } from "../utils/app-error";

function mapCustomerOrder(order: Record<string, unknown>) {
  const totals = order.totals as {
    totalCents: number;
    subtotalCents: number;
    shippingCents: number;
    taxCents: number;
    discountCents: number;
    currency: string;
  };
  const items = (order.items as Array<Record<string, unknown>>) ?? [];
  const events = (order.events as Array<Record<string, unknown>>) ?? [];

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    paidAt: order.paidAt ?? null,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    shippingMethod: order.shippingMethod,
    trackingNumber: order.trackingNumber ?? null,
    trackingUrl: (order as { trackingUrl?: string }).trackingUrl ?? null,
    shippingCarrier: order.shippingCarrier ?? null,
    estimatedDeliveryAt:
      (order as { estimatedDeliveryAt?: Date }).estimatedDeliveryAt ?? null,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    totals,
    itemCount: items.reduce(
      (sum, item) => sum + Number(item.quantity ?? 0),
      0
    ),
    items: items.map((item) => ({
      id: String(item._id ?? ""),
      productName: item.productName,
      productSlug: item.productSlug,
      sku: item.sku,
      options: item.options,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
      imageUrl: item.imageUrl ?? null,
    })),
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress ?? null,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId ?? null,
    stripePaymentIntentId: order.stripePaymentIntentId ?? null,
    events: events.map((event) => ({
      type: String(event.type ?? ""),
      message: String(event.message ?? ""),
      createdAt: event.createdAt ?? null,
    })),
  };
}

/**
 * Link prior guest orders to an authenticated account when the checkout email
 * matches. Requires the customer to own the email via registration/login —
 * never expose guest orders based on an unverified browser-supplied email alone.
 */
export async function claimGuestOrdersForUser(userId: string, email: string) {
  if (!Types.ObjectId.isValid(userId)) {
    return { claimed: 0 };
  }
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return { claimed: 0 };
  }

  const result = await OrderModel.updateMany(
    {
      $and: [
        { customerEmail: normalized },
        {
          $or: [{ userId: { $exists: false } }, { userId: null }],
        },
      ],
    },
    {
      $set: { userId: new Types.ObjectId(userId) },
      $push: {
        events: {
          type: "account_linked",
          message: "Order linked to customer account after verified sign-in",
          createdAt: new Date(),
        },
      },
    }
  );

  return { claimed: result.modifiedCount ?? 0 };
}

export async function listCustomerOrders(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(400, "INVALID_ID", "Invalid user id");
  }

  const orders = await OrderModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return orders.map((order) => mapCustomerOrder(order as Record<string, unknown>));
}

export async function getCustomerOrder(userId: string, orderNumber: string) {
  const order = await OrderModel.findOne({
    orderNumber,
    userId,
  }).lean();

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return mapCustomerOrder(order as Record<string, unknown>);
}

export async function lookupGuestOrder(orderNumber: string, email: string) {
  const order = await OrderModel.findOne({
    orderNumber,
    customerEmail: email.toLowerCase().trim(),
  }).lean();

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return mapCustomerOrder(order as Record<string, unknown>);
}
