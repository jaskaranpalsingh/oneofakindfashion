import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.API_PORT, () => {
    logger.info("API server listening", {
      port: env.API_PORT,
      baseUrl: env.API_BASE_URL,
      webOrigin: env.WEB_ORIGIN,
    });

    if (!env.integrations.stripeConfigured) {
      logger.warn(
        "Stripe is not configured — development checkout will mark orders paid without card payment"
      );
    }
    if (!env.integrations.emailConfigured) {
      logger.warn("Email provider is not configured — emails will be logged only");
    }
    if (!env.integrations.cloudinaryConfigured) {
      logger.warn(
        "Cloudinary is not configured — media uploads unavailable until set"
      );
    }
  });

  const shutdown = async (signal: string) => {
    logger.info("Shutting down API", { signal });
    server.close(async () => {
      const { disconnectDatabase } = await import("./config/db");
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logger.error("Failed to start API", { error });
  process.exit(1);
});
