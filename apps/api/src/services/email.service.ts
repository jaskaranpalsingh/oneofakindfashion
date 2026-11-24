import { env } from "../config/env";
import { logger } from "../utils/logger";

export type OrderConfirmationEmailInput = {
  to: string;
  orderNumber: string;
  customerName: string;
  totalCents: number;
  currency: string;
  items: Array<{
    productName: string;
    quantity: number;
    sku: string;
    options?: Record<string, string | undefined>;
  }>;
  shippingMethod: string;
  shippingAddress?: {
    line1?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
};

function formatCad(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function buildHtml(input: OrderConfirmationEmailInput) {
  const lines = input.items
    .map((item) => {
      const opts = Object.entries(item.options ?? {})
        .filter(([, v]) => Boolean(v))
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      return `<li><strong>${item.productName}</strong> × ${item.quantity}${
        opts ? ` <span style="color:#6F746E">(${opts})</span>` : ""
      } · SKU ${item.sku}</li>`;
    })
    .join("");

  const address =
    input.shippingMethod === "local_pickup"
      ? "Local pickup — 1283 Millbourne Road East NW, Edmonton, Alberta"
      : [
          input.shippingAddress?.line1,
          input.shippingAddress?.city,
          input.shippingAddress?.province,
          input.shippingAddress?.postalCode,
          input.shippingAddress?.country,
        ]
          .filter(Boolean)
          .join(", ");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FFF9F0;font-family:Georgia,serif;color:#202820">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #E8E2D2">
    <div style="background:#003F2D;color:#fff;padding:28px 24px">
      <p style="margin:0;letter-spacing:0.2em;font-size:11px;color:#D4AF37;font-family:sans-serif">ONE OF A KIND FASHION</p>
      <h1 style="margin:12px 0 0;font-weight:400;font-size:28px">Thank you for your order</h1>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 8px;font-family:sans-serif;font-size:14px;color:#6F746E">Hi ${input.customerName},</p>
      <p style="margin:0 0 16px;font-family:sans-serif;font-size:14px;color:#6F746E">We've received your order <strong style="color:#003F2D">${input.orderNumber}</strong>.</p>
      <ul style="padding-left:18px;font-family:sans-serif;font-size:14px;line-height:1.6">${lines}</ul>
      <p style="margin:16px 0 0;font-family:sans-serif;font-size:15px;color:#003F2D"><strong>Amount paid: ${formatCad(input.totalCents)}</strong></p>
      <p style="margin:12px 0 0;font-family:sans-serif;font-size:13px;color:#6F746E">Delivery: ${address}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends order confirmation when EMAIL_PROVIDER_KEY + EMAIL_FROM are set.
 * Uses Resend-compatible HTTP API. Never pretends success when unconfigured.
 */
export async function sendOrderConfirmationEmail(
  input: OrderConfirmationEmailInput
): Promise<{ sent: boolean; reason?: string }> {
  if (!env.integrations.emailConfigured) {
    logger.warn("Order confirmation email skipped — email provider not configured", {
      orderNumber: input.orderNumber,
      to: input.to,
    });
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_PROVIDER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: `Order confirmed · ${input.orderNumber}`,
      html: buildHtml(input),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("Order confirmation email failed", {
      orderNumber: input.orderNumber,
      status: response.status,
      body,
    });
    return { sent: false, reason: "EMAIL_PROVIDER_ERROR" };
  }

  logger.info("Order confirmation email sent", {
    orderNumber: input.orderNumber,
    to: input.to,
  });
  return { sent: true };
}

export type OrderShippedEmailInput = {
  to: string;
  orderNumber: string;
  customerName: string;
  shippingMethod: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingAddress?: {
    line1?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  items: Array<{ productName: string; quantity: number; sku: string }>;
};

export async function sendOrderShippedEmail(
  input: OrderShippedEmailInput
): Promise<{ sent: boolean; reason?: string }> {
  if (!env.integrations.emailConfigured) {
    logger.warn("Shipping email skipped — email provider not configured", {
      orderNumber: input.orderNumber,
      to: input.to,
    });
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  const address = [
    input.shippingAddress?.line1,
    input.shippingAddress?.city,
    input.shippingAddress?.province,
    input.shippingAddress?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const items = input.items
    .map(
      (item) =>
        `<li><strong>${item.productName}</strong> × ${item.quantity} · SKU ${item.sku}</li>`
    )
    .join("");

  const track =
    input.trackingUrl ||
    (input.trackingNumber
      ? `Tracking number: ${input.trackingNumber}`
      : "Tracking details will follow when available.");

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FFF9F0;font-family:Georgia,serif;color:#202820">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #E8E2D2">
    <div style="background:#003F2D;color:#fff;padding:28px 24px">
      <p style="margin:0;letter-spacing:0.2em;font-size:11px;color:#D4AF37;font-family:sans-serif">ONE OF A KIND FASHION</p>
      <h1 style="margin:12px 0 0;font-weight:400;font-size:28px">Your order has shipped</h1>
    </div>
    <div style="padding:24px;font-family:sans-serif;font-size:14px;color:#6F746E">
      <p>Hi ${input.customerName},</p>
      <p>Order <strong style="color:#003F2D">${input.orderNumber}</strong> is on its way.</p>
      <ul style="padding-left:18px;line-height:1.6">${items}</ul>
      <p>Carrier: ${input.shippingCarrier || "As arranged"}</p>
      <p>${track}</p>
      <p>Ship to: ${address || "Canada"}</p>
      <p style="margin-top:20px"><a href="${env.WEB_ORIGIN}/track-order?order=${encodeURIComponent(input.orderNumber)}" style="display:inline-block;background:#003F2D;color:#fff;padding:12px 18px;text-decoration:none;letter-spacing:0.12em;font-size:11px;text-transform:uppercase">Track order</a></p>
      <p style="margin-top:16px">Questions? Reply to this email or call our boutique.</p>
    </div>
  </div></body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_PROVIDER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: `Shipped · ${input.orderNumber}`,
      html,
    }),
  });

  if (!response.ok) {
    logger.error("Shipping email failed", {
      orderNumber: input.orderNumber,
      status: response.status,
    });
    return { sent: false, reason: "EMAIL_PROVIDER_ERROR" };
  }
  return { sent: true };
}

export async function sendOrderReadyForPickupEmail(input: {
  to: string;
  orderNumber: string;
  customerName: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!env.integrations.emailConfigured) {
    logger.warn("Pickup-ready email skipped — email provider not configured", {
      orderNumber: input.orderNumber,
    });
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FFF9F0;font-family:Georgia,serif;color:#202820">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #E8E2D2">
    <div style="background:#003F2D;color:#fff;padding:28px 24px">
      <p style="margin:0;letter-spacing:0.2em;font-size:11px;color:#D4AF37;font-family:sans-serif">ONE OF A KIND FASHION</p>
      <h1 style="margin:12px 0 0;font-weight:400;font-size:28px">Ready for pickup</h1>
    </div>
    <div style="padding:24px;font-family:sans-serif;font-size:14px;color:#6F746E">
      <p>Hi ${input.customerName},</p>
      <p>Order <strong style="color:#003F2D">${input.orderNumber}</strong> is ready for collection at 1283 Millbourne Road East NW, Edmonton, Alberta.</p>
      <p>Please bring your order confirmation and a valid ID.</p>
    </div>
  </div></body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_PROVIDER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: `Ready for pickup · ${input.orderNumber}`,
      html,
    }),
  });

  if (!response.ok) {
    return { sent: false, reason: "EMAIL_PROVIDER_ERROR" };
  }
  return { sent: true };
}
