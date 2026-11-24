import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import { env, isAllowedWebOrigin } from "./config/env";
import { createSessionMiddleware } from "./config/session";
import { hydrateAuth } from "./middleware/auth";
import { apiRouter } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { requestIdMiddleware } from "./middleware/request-id";
import { asyncHandler } from "./utils/async-handler";
import { stripeWebhookHandler } from "./controllers/stripe-webhook.controller";
import {
  legacyWebPublicUploadDir,
  localProductUploadDir,
} from "./utils/upload-paths";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(requestIdMiddleware);
  app.use(compression());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedWebOrigin(origin)) {
          callback(null, origin ?? true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      exposedHeaders: ["X-Guest-Id"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Guest-Id",
        "X-Request-Id",
        "Cache-Control",
        "Pragma",
      ],
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Stripe webhooks require the unmodified raw body for signature verification.
  app.post(
    "/api/v1/webhooks/stripe",
    express.raw({ type: "application/json" }),
    asyncHandler(stripeWebhookHandler)
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(createSessionMiddleware());
  app.use(hydrateAuth);

  if (!env.isTest) {
    app.use(morgan(env.isDev ? "dev" : "combined"));
  }

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: "ONE OF A KIND FASHION API",
        version: "v1",
        docs: "/api/v1/health",
      },
    });
  });

  // Local product images (and legacy Next public uploads) — always fresh from disk.
  const uploadDirs = [localProductUploadDir(), legacyWebPublicUploadDir()].filter(
    (dir) => {
      try {
        fs.mkdirSync(dir, { recursive: true });
        return true;
      } catch {
        return false;
      }
    }
  );
  for (const dir of uploadDirs) {
    app.use(
      "/uploads/products",
      express.static(dir, {
        fallthrough: true,
        maxAge: env.isProd ? "7d" : 0,
        index: false,
      })
    );
  }

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
