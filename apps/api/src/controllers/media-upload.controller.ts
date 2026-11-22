import type { Request, Response } from "express";
import { uploadProductImages } from "../services/media-upload.service";
import { sendSuccess } from "../utils/api-response";
import { AppError } from "../utils/app-error";

export async function uploadProductImagesHandler(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    throw new AppError(400, "NO_FILES", "No image files received");
  }
  const data = await uploadProductImages(files);
  return sendSuccess(res, data, 201);
}
