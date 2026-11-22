import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);

  try {
    const connection = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.isDev,
    });
    logger.info("MongoDB connected", {
      host: connection.connection.host,
      name: connection.connection.name,
    });
    return connection;
  } catch (error) {
    logger.error("MongoDB connection failed", { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
