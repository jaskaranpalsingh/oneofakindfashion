import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";
import { sendError } from "../utils/api-response";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export function notFoundHandler(_req: Request, res: Response) {
  return sendError(res, 404, "NOT_FOUND", "Route not found");
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid request data", {
      issues: err.flatten(),
    });
  }

  logger.error("Unhandled error", { error: err });

  return sendError(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    env.isProd ? "Something went wrong" : String(err)
  );
}
