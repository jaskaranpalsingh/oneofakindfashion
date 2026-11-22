import {
  FulfillmentStatus,
  PaymentStatus,
} from "@ookf/shared";
import { Types } from "mongoose";
import { OrderModel } from "../models/order.model";
import { AppError } from "../utils/app-error";

function assertObjectId(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", `Invalid ${label}`);
  }
}

function mapOrderSummary(order: Record<string, unknown>) {
  const items = (order.items ?? []) as Array<{ quantity?: number }>;
  const totals = (order.totals ?? {}) as {
    totalCents?: number;
    currency?: string;
  };
  return {
    id: String(order._id),
    orderNumber: order.orderNumber as string,
    customerName: order.customerName as string,
    customerEmail: order.customerEmail as string,
    itemCount: items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    totalCents: totals.totalCents ?? 0,
    currency: totals.currency ?? "CAD",
    paymentStatus: order.paymentStatus as string,
    fulfillmentStatus: order.fulfillmentStatus as string,
    shippingMethod: order.shippingMethod as string,
    createdAt: order.createdAt as Date,
  };
}

export async function listOrders(options?: {
  limit?: number;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  q?: string;
}) {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const filter: Record<string, unknown> = {};

  if (options?.paymentStatus) {
    filter.paymentStatus = options.paymentStatus;
  }
  if (options?.fulfillmentStatus) {
    filter.fulfillmentStatus = options.fulfillmentStatus;
  }
  if (options?.q?.trim()) {
    const q = options.q.trim();
    filter.$or = [
      { orderNumber: new RegExp(q, "i") },
      { customerName: new RegExp(q, "i") },
      { customerEmail: new RegExp(q, "i") },
    ];
  }

  const orders = await OrderModel.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  return orders.map((order) => mapOrderSummary(order as Record<string, unknown>));
}

export async function getOrderById(id: string) {
  assertObjectId(id, "orderId");
  const order = await OrderModel.findById(id).lean();
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone ?? null,
    guestEmail: order.guestEmail ?? null,
    items: (order.items ?? []).map((item) => ({
      id: String(item._id),
      productId: item.productId ? String(item.productId) : null,
      variantId: item.variantId ? String(item.variantId) : null,
      productName: item.productName,
      productSlug: item.productSlug ?? null,
      sku: item.sku,
      options: item.options ?? {},
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
      imageUrl: item.imageUrl ?? null,
    })),
    totals: order.totals,
    billingAddress: order.billingAddress,
    shippingAddress: order.shippingAddress,
    shippingMethod: order.shippingMethod,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    couponCode: order.couponCode ?? null,
    discountCents: order.discountCents ?? 0,
    taxBreakdown: order.taxBreakdown ?? [],
    trackingNumber: order.trackingNumber ?? null,
    shippingCarrier: order.shippingCarrier ?? null,
    internalNotes: order.internalNotes ?? null,
    paidAt: order.paidAt ?? null,
    cancelledAt: order.cancelledAt ?? null,
    refundedAt: order.refundedAt ?? null,
    events: (order.events ?? []).map((event) => ({
      id: String(event._id),
      type: event.type,
      message: event.message,
      createdAt: event.createdAt,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function updateOrderFulfillment(
  id: string,
  input: {
    fulfillmentStatus?: string;
    trackingNumber?: string;
    shippingCarrier?: string;
    internalNotes?: string;
  },
  actorUserId?: string
) {
  assertObjectId(id, "orderId");
  const order = await OrderModel.findById(id);
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (
    input.fulfillmentStatus &&
    !Object.values(FulfillmentStatus).includes(
      input.fulfillmentStatus as (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus]
    )
  ) {
    throw new AppError(400, "INVALID_STATUS", "Invalid fulfillment status");
  }

  // Do not allow marking payment as collected via this endpoint.
  if (input.fulfillmentStatus) {
    if (
      input.fulfillmentStatus === FulfillmentStatus.AWAITING_FULFILLMENT &&
      order.paymentStatus !== PaymentStatus.PAID &&
      order.paymentStatus !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new AppError(
        400,
        "PAYMENT_REQUIRED",
        "Order must be paid before awaiting fulfillment"
      );
    }
    order.fulfillmentStatus =
      input.fulfillmentStatus as (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus];
  }

  if (input.trackingNumber !== undefined) {
    order.trackingNumber = input.trackingNumber;
  }
  if (input.shippingCarrier !== undefined) {
    order.shippingCarrier = input.shippingCarrier;
  }
  if (input.internalNotes !== undefined) {
    order.internalNotes = input.internalNotes;
  }

  order.events.push({
    type: "fulfillment_updated",
    message: `Fulfillment updated to ${order.fulfillmentStatus}`,
    actorUserId: actorUserId
      ? new Types.ObjectId(actorUserId)
      : undefined,
    createdAt: new Date(),
  });

  await order.save();
  return getOrderById(id);
}
