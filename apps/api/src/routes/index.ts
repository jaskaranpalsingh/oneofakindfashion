import { Router } from "express";
import { adminCatalogueRouter } from "./admin/catalogue.routes";
import { authRouter } from "./auth.routes";
import { cartRouter } from "./cart.routes";
import { categoryRouter } from "./category.routes";
import { checkoutRouter } from "./checkout.routes";
import { healthRouter } from "./health.routes";
import { orderRouter } from "./order.routes";
import { productRouter } from "./product.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/checkout", checkoutRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/admin", adminCatalogueRouter);

// Public store settings (announcement, contact) — no secrets.
apiRouter.get("/settings", async (req, res, next) => {
  try {
    const { getStoreSettings } = await import("../services/admin-settings.service");
    const { sendSuccess } = await import("../utils/api-response");
    const settings = await getStoreSettings();
    const { env } = await import("../config/env");
    return sendSuccess(res, {
      storeName: settings.storeName,
      phone: settings.phone,
      email: settings.email,
      addressLine1: settings.addressLine1,
      city: settings.city,
      province: settings.province,
      postalCode: settings.postalCode,
      country: settings.country,
      announcementBarText: settings.announcementBarText,
      currency: settings.currency,
      socialLinks: {
        instagram: settings.socialLinks?.instagram ?? null,
        facebook: settings.socialLinks?.facebook ?? null,
        pinterest: settings.socialLinks?.pinterest ?? null,
      },
      shipping: {
        localPickupEnabled: settings.shipping.localPickupEnabled,
        freeShippingMinimumCents:
          settings.shipping.freeShippingMinimumCents,
      },
      payments: {
        stripeConfigured: env.integrations.stripeConfigured,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Remaining domain routers: /collections, /search
