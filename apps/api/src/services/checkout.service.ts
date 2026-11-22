import {
  FulfillmentStatus,
  PaymentStatus,
  ShippingMethod,
  addressSchema,
  cartItemSchema,
} from "@ookf/shared";
import { z } from "zod";
import Stripe from "stripe";
import { env } from "../config/env";
import { CartModel } from "../models/cart.model";
import { OrderDocument, OrderModel } from "../models/order.model";
import { PaymentModel } from "../models/payment.model";
import { ProductModel } from "../models/product.model";
import { StoreSettingsModel } from "../models/content.model";
import { AppError } from "../utils/app-error";
import { getCart } from "./cart.service";
import { sendOrderConfirmationEmail } from "./email.service";
import {
  commitInventoryForOrder,
  releaseInventoryForOrder,
  reserveInventoryForOrder,
} from "./inventory-reservation.service";

const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().trim().max(30).optional(),
  shippingMethod: z.nativeEnum(ShippingMethod),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  couponCode: z.string().trim().optional(),
  mode: z.enum(["cart", "buy_now"]).default("cart"),
});

type CheckoutLine = {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  sku: string;
  options: {
    size?: string;
    colour?: string;
    material?: string;
    other?: string;
  };
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string | null;
};

function orderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `OOKF-${stamp}-${rand}`;
}

function availableStock(variant: {
  stockQuantity: number;
  reservedQuantity?: number;
}) {
  return Math.max(0, variant.stockQuantity - (variant.reservedQuantity ?? 0));
}

async function resolveBuyNowLine(input: {
  productId: string;
  variantId: string;
  quantity: number;
}): Promise<CheckoutLine> {
  const data = cartItemSchema.parse(input);
  const product = await ProductModel.findOne({
    _id: data.productId,
    deletedAt: null,
    status: "published",
  });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  const variant = product.variants.id(data.variantId);
  if (!variant || !(variant.isAvailable ?? true)) {
    throw new AppError(400, "VARIANT_UNAVAILABLE", "Variant unavailable");
  }
  const stock = availableStock(variant);
  if (data.quantity > stock && !product.allowBackorder) {
    throw new AppError(
      409,
      "INSUFFICIENT_STOCK",
      "Not enough stock for this variant"
    );
  }
  const unitPriceCents = variant.priceCents ?? product.priceCents;
  const rawOptions = variant.options ?? {};
  return {
    productId: String(product._id),
    variantId: String(variant._id),
    name: product.name,
    slug: product.slug,
    sku: variant.sku,
    options: {
      size: rawOptions.size ?? undefined,
      colour: rawOptions.colour ?? undefined,
      material: rawOptions.material ?? undefined,
      other: rawOptions.other ?? undefined,
    },
    quantity: data.quantity,
    unitPriceCents,
    lineTotalCents: unitPriceCents * data.quantity,
    imageUrl: variant.imageUrl ?? product.images?.[0]?.url ?? null,
  };
}

async function loadShippingTax(
  shippingMethod: ShippingMethod,
  province: string,
  subtotalCents: number
) {
  const settings =
    (await StoreSettingsModel.findOne({ key: "default" }).lean()) ??
    ({
      shipping: {
        standardCents: 1500,
        expressCents: 2500,
        freeShippingMinimumCents: 20000,
        localPickupEnabled: true,
      },
      taxRules: [] as Array<{ province: string; name: string; rateBps: number }>,
    } as const);

  let shippingCents = 0;
  if (shippingMethod === ShippingMethod.LOCAL_PICKUP) {
    if (!settings.shipping?.localPickupEnabled) {
      throw new AppError(400, "PICKUP_DISABLED", "Local pickup is not enabled");
    }
    shippingCents = 0;
  } else if (shippingMethod === ShippingMethod.EXPRESS) {
    shippingCents = settings.shipping?.expressCents ?? 2500;
  } else {
    shippingCents = settings.shipping?.standardCents ?? 1500;
    if (
      settings.shipping?.freeShippingMinimumCents &&
      subtotalCents >= settings.shipping.freeShippingMinimumCents
    ) {
      shippingCents = 0;
    }
  }

  const taxRules = (settings.taxRules ?? []).filter(
    (rule) => rule.province === province
  );
  const taxable = subtotalCents + shippingCents;
  const taxBreakdown = taxRules.map((rule) => ({
    name: rule.name,
    rateBps: rule.rateBps,
    amountCents: Math.round((taxable * rule.rateBps) / 10000),
  }));
  const taxCents = taxBreakdown.reduce((sum, row) => sum + row.amountCents, 0);

  return { shippingCents, taxCents, taxBreakdown, settings };
}

export async function setBuyNowIntent(
  identity: { userId?: string; guestId?: string },
  input: unknown
) {
  // Validate stock/price now; session storage happens in the controller.
  const line = await resolveBuyNowLine(
    cartItemSchema.parse(input) as {
      productId: string;
      variantId: string;
      quantity: number;
    }
  );
  return {
    productId: line.productId,
    variantId: line.variantId,
    quantity: line.quantity,
    name: line.name,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.lineTotalCents,
  };
}

export async function createCheckoutSession(
  identity: { userId?: string; guestId?: string },
  input: unknown,
  buyNow?: { productId: string; variantId: string; quantity: number } | null
) {
  const data = checkoutSchema.parse(input);
  let items: CheckoutLine[] = [];

  if (data.mode === "buy_now") {
    if (!buyNow) {
      throw new AppError(
        400,
        "BUY_NOW_EXPIRED",
        "Buy Now selection expired. Please select the product again."
      );
    }
    items = [await resolveBuyNowLine(buyNow)];
  } else {
    const cart = await getCart(identity);
    if (cart.items.length === 0) {
      throw new AppError(400, "CART_EMPTY", "Cart is empty");
    }
    items = cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      options: {
        size: item.options?.size ?? undefined,
        colour: item.options?.colour ?? undefined,
        material: item.options?.material ?? undefined,
        other: item.options?.other ?? undefined,
      },
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
      imageUrl: item.imageUrl,
    }));
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

  // Prefer the authenticated cart coupon for cart checkout; Buy Now skips coupons.
  let discountCents = 0;
  let appliedCoupon: string | undefined;
  if (data.mode !== "buy_now") {
    const cart = await getCart(identity);
    discountCents = cart.discountCents ?? 0;
    appliedCoupon = cart.couponCode ?? undefined;
  }
  if (data.couponCode && !appliedCoupon) {
    // Explicit checkout coupon code can be added later; cart coupon is authoritative today.
    appliedCoupon = data.couponCode.toUpperCase();
  }

  const taxableBase = Math.max(0, subtotalCents - discountCents);
  const { shippingCents, taxCents, taxBreakdown } = await loadShippingTax(
    data.shippingMethod,
    data.shippingAddress.province,
    taxableBase
  );
  const totalCents = taxableBase + shippingCents + taxCents;
  const billing = data.billingAddress ?? data.shippingAddress;

  const order = await OrderModel.create({
    orderNumber: orderNumber(),
    userId: identity.userId,
    guestId: identity.guestId,
    guestEmail: identity.userId ? undefined : data.email,
    customerName: `${data.shippingAddress.firstName} ${data.shippingAddress.lastName}`,
    customerEmail: data.email.toLowerCase(),
    customerPhone: data.phone,
    items: items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.name,
      productSlug: item.slug,
      sku: item.sku,
      options: item.options,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
      imageUrl: item.imageUrl,
    })),
    totals: {
      subtotalCents,
      discountCents,
      shippingCents,
      taxCents,
      totalCents,
      currency: "CAD",
    },
    billingAddress: billing,
    shippingAddress: data.shippingAddress,
    shippingMethod: data.shippingMethod,
    paymentStatus: PaymentStatus.PENDING,
    fulfillmentStatus: FulfillmentStatus.PENDING_PAYMENT,
    couponCode: appliedCoupon,
    discountCents,
    taxBreakdown,
    inventoryReserved: false,
    events: [
      {
        type: "checkout_started",
        message:
          data.mode === "buy_now"
            ? "Buy Now checkout session created"
            : "Checkout session created",
      },
    ],
  });

  try {
    await reserveInventoryForOrder(
      String(order._id),
      items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        quantity: item.quantity,
      }))
    );
    order.inventoryReserved = true;
    await order.save();
  } catch (error) {
    order.paymentStatus = PaymentStatus.CANCELLED;
    order.fulfillmentStatus = FulfillmentStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.events.push({
      type: "checkout_failed",
      message: "Inventory reservation failed",
    });
    await order.save();
    throw error;
  }

  // Local/dev checkout without Stripe so the storefront can be tested end-to-end.
  if (!env.integrations.stripeConfigured || !env.STRIPE_SECRET_KEY) {
    if (!env.isDev && !env.isTest) {
      throw new AppError(
        503,
        "STRIPE_NOT_CONFIGURED",
        "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env before accepting payments."
      );
    }

    await finalizeDevPaidOrder({
      order,
      totalCents,
      reason: "Development checkout (Stripe keys not set)",
    });

    const confirmationUrl = new URL(
      `/order-confirmation/${order.orderNumber}`,
      env.WEB_ORIGIN
    );
    confirmationUrl.searchParams.set("email", data.email);

    return {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      checkoutUrl: confirmationUrl.toString(),
      totalCents,
      paymentMode: "dev" as const,
    };
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: data.email,
      success_url: `${env.WEB_ORIGIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.WEB_ORIGIN}/checkout/cancelled?order=${order.orderNumber}`,
      line_items: [
        ...items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "cad",
            unit_amount: item.unitPriceCents,
            product_data: {
              name: item.name,
              metadata: {
                sku: item.sku,
                productId: item.productId,
                variantId: item.variantId,
              },
            },
          },
        })),
        ...(shippingCents > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "cad",
                  unit_amount: shippingCents,
                  product_data: { name: "Shipping" },
                },
              },
            ]
          : []),
        ...(taxCents > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "cad",
                  unit_amount: taxCents,
                  product_data: { name: "Tax" },
                },
              },
            ]
          : []),
      ],
      metadata: {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
      },
      payment_intent_data: {
        metadata: {
          orderId: String(order._id),
          orderNumber: order.orderNumber,
        },
      },
    });
  } catch (error) {
    if (order.inventoryReserved) {
      await releaseInventoryForOrder(
        String(order._id),
        items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          quantity: item.quantity,
        }))
      );
      order.inventoryReserved = false;
    }
    order.paymentStatus = PaymentStatus.FAILED;
    order.events.push({
      type: "stripe_session_failed",
      message: "Unable to create Stripe checkout session",
    });
    await order.save();
    throw error;
  }

  order.stripeCheckoutSessionId = session.id;
  await order.save();

  await PaymentModel.create({
    orderId: order._id,
    provider: "stripe",
    status: PaymentStatus.PENDING,
    amountCents: totalCents,
    currency: "CAD",
    stripeCheckoutSessionId: session.id,
  });

  return {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    checkoutUrl: session.url,
    totalCents,
    paymentMode: "stripe" as const,
  };
}

async function finalizeDevPaidOrder(params: {
  order: OrderDocument;
  totalCents: number;
  reason: string;
}) {
  const { order, totalCents, reason } = params;
  const lines = order.items.map((item) => ({
    productId: String(item.productId),
    variantId: String(item.variantId),
    sku: item.sku,
    quantity: item.quantity,
  }));

  await commitInventoryForOrder(String(order._id), lines);
  order.inventoryReserved = false;
  order.paymentStatus = PaymentStatus.PAID;
  order.fulfillmentStatus = FulfillmentStatus.AWAITING_FULFILLMENT;
  order.paidAt = new Date();
  order.events.push({
    type: "payment_paid",
    message: reason,
  });
  await order.save();

  await PaymentModel.create({
    orderId: order._id,
    provider: "dev",
    status: PaymentStatus.PAID,
    amountCents: totalCents,
    currency: "CAD",
  });

  if (order.userId) {
    await CartModel.findOneAndUpdate(
      { userId: order.userId },
      { $set: { items: [] } }
    );
  }
  if (order.guestId) {
    await CartModel.findOneAndUpdate(
      { guestId: order.guestId },
      { $set: { items: [] } }
    );
  }

  const emailResult = await sendOrderConfirmationEmail({
    to: order.customerEmail,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    totalCents: order.totals.totalCents,
    currency: order.totals.currency,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      sku: item.sku,
      options: item.options as Record<string, string | undefined>,
    })),
    shippingMethod: order.shippingMethod,
    shippingAddress: order.shippingAddress as {
      line1?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    },
  });

  if (emailResult.sent) {
    order.events.push({
      type: "confirmation_email_sent",
      message: "Order confirmation email sent",
    });
    await order.save();
  } else if (emailResult.reason) {
    order.events.push({
      type: "confirmation_email_skipped",
      message: `Email not sent: ${emailResult.reason}`,
    });
    await order.save();
  }
}

/**
 * Idempotent paid-order finalisation used by Stripe webhooks.
 */
export async function markOrderPaidFromStripe(params: {
  orderId: string;
  stripeEventId: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
}) {
  const existingPayment = await PaymentModel.findOne({
    stripeEventId: params.stripeEventId,
  });
  if (existingPayment) {
    return { duplicate: true, orderId: params.orderId };
  }

  const order = await OrderModel.findById(params.orderId);
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    await PaymentModel.findOneAndUpdate(
      { stripeCheckoutSessionId: params.stripeCheckoutSessionId },
      {
        $set: {
          stripeEventId: params.stripeEventId,
          stripePaymentIntentId: params.stripePaymentIntentId,
          status: PaymentStatus.PAID,
        },
      }
    );
    return { duplicate: false, alreadyPaid: true, orderId: params.orderId };
  }

  const lines = order.items.map((item) => ({
    productId: String(item.productId),
    variantId: String(item.variantId),
    sku: item.sku,
    quantity: item.quantity,
  }));

  await commitInventoryForOrder(String(order._id), lines);
  order.inventoryReserved = false;

  order.paymentStatus = PaymentStatus.PAID;
  order.fulfillmentStatus = FulfillmentStatus.AWAITING_FULFILLMENT;
  order.paidAt = new Date();
  order.stripePaymentIntentId = params.stripePaymentIntentId;
  order.events.push({
    type: "payment_paid",
    message: "Payment verified via Stripe webhook",
  });
  await order.save();

  await PaymentModel.findOneAndUpdate(
    {
      orderId: order._id,
      stripeCheckoutSessionId: params.stripeCheckoutSessionId,
    },
    {
      $set: {
        status: PaymentStatus.PAID,
        stripeEventId: params.stripeEventId,
        stripePaymentIntentId: params.stripePaymentIntentId,
      },
    },
    { upsert: true }
  );

  if (order.userId) {
    await CartModel.findOneAndUpdate(
      { userId: order.userId },
      { $set: { items: [] } }
    );
  }
  if (order.guestId) {
    await CartModel.findOneAndUpdate(
      { guestId: order.guestId },
      { $set: { items: [] } }
    );
  }

  const emailResult = await sendOrderConfirmationEmail({
    to: order.customerEmail,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    totalCents: order.totals.totalCents,
    currency: order.totals.currency,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      sku: item.sku,
      options: item.options as Record<string, string | undefined>,
    })),
    shippingMethod: order.shippingMethod,
    shippingAddress: order.shippingAddress as {
      line1?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    },
  });

  if (emailResult.sent) {
    order.events.push({
      type: "confirmation_email_sent",
      message: "Order confirmation email sent",
    });
    await order.save();
  } else if (emailResult.reason) {
    order.events.push({
      type: "confirmation_email_skipped",
      message: `Email not sent: ${emailResult.reason}`,
    });
    await order.save();
  }

  return {
    duplicate: false,
    orderId: params.orderId,
    orderNumber: order.orderNumber,
  };
}

export async function cancelPendingCheckoutOrder(orderNumber: string) {
  const order = await OrderModel.findOne({ orderNumber });
  if (!order) return null;
  if (order.paymentStatus !== PaymentStatus.PENDING) return order;

  if (order.inventoryReserved) {
    await releaseInventoryForOrder(
      String(order._id),
      order.items.map((item) => ({
        productId: String(item.productId),
        variantId: String(item.variantId),
        sku: item.sku,
        quantity: item.quantity,
      }))
    );
    order.inventoryReserved = false;
  }

  order.paymentStatus = PaymentStatus.CANCELLED;
  order.fulfillmentStatus = FulfillmentStatus.CANCELLED;
  order.cancelledAt = new Date();
  order.events.push({
    type: "checkout_cancelled",
    message: "Customer cancelled Stripe checkout",
  });
  await order.save();
  return order;
}

export async function getOrderByStripeSession(sessionId: string) {
  return OrderModel.findOne({ stripeCheckoutSessionId: sessionId }).lean();
}

export async function getOrderByNumberForCustomer(params: {
  orderNumber: string;
  userId?: string;
  email?: string;
}) {
  const order = await OrderModel.findOne({
    orderNumber: params.orderNumber,
  }).lean();
  if (!order) return null;

  if (params.userId && order.userId && String(order.userId) === params.userId) {
    return order;
  }
  if (
    params.email &&
    order.customerEmail?.toLowerCase() === params.email.toLowerCase()
  ) {
    return order;
  }
  if (params.userId && !order.userId) {
    // Guest order claimed after account login only via email match.
    return null;
  }
  return null;
}
