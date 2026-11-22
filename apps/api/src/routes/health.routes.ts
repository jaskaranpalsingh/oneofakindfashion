import { Router } from "express";
import mongoose from "mongoose";
import { BRAND } from "@ookf/shared";
import { env } from "../config/env";
import { sendSuccess } from "../utils/api-response";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
        ? "connecting"
        : dbState === 3
          ? "disconnecting"
          : "disconnected";

  return sendSuccess(res, {
    service: `${BRAND.shortName} API`,
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: dbStatus,
    integrations: {
      stripe: env.integrations.stripeConfigured
        ? "configured"
        : "not_configured",
      cloudinary: env.integrations.cloudinaryConfigured
        ? "configured"
        : "not_configured",
      email: env.integrations.emailConfigured
        ? "configured"
        : "not_configured",
    },
  });
});
