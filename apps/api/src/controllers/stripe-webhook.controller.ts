import type { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../config/env";
import {
  markOrderPaidFromStripe,
  cancelPendingCheckoutOrder,
} from "../services/checkout.service";
import { OrderModel } from "../models/order.model";
import { logger } from "../utils/logger";
import { AppError } from "../utils/app-error";

export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(
      503,
      "STRIPE_NOT_CONFIGURED",
      "Stripe webhook secret is not configured"
    );
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    throw new AppError(400, "MISSING_SIGNATURE", "Missing Stripe signature");
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    throw new AppError(
      400,
      "INVALID_BODY",
      "Stripe webhook requires raw body"
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error("Stripe signature verification failed", { error });
    throw new AppError(400, "INVALID_SIGNATURE", "Invalid Stripe signature");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId =
        session.metadata?.orderId ??
        (
          await OrderModel.findOne({
            stripeCheckoutSessionId: session.id,
          }).select("_id")
        )?._id?.toString();

      if (!orderId) {
        logger.warn("Stripe session completed without order mapping", {
          sessionId: session.id,
        });
        break;
      }

      if (session.payment_status === "paid") {
        await markOrderPaidFromStripe({
          orderId,
          stripeEventId: event.id,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
        });
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderNumber = session.metadata?.orderNumber;
      if (orderNumber) {
        await cancelPendingCheckoutOrder(orderNumber);
      }
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
}
