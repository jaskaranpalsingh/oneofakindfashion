import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";
import { localProductUploadDir } from "../utils/upload-paths";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_BYTES = 5 * 1024 * 1024;

function assertImageFile(file: Express.Multer.File) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new AppError(
      400,
      "INVALID_IMAGE_TYPE",
      "Only JPEG, PNG, and WebP images are allowed"
    );
  }
  if (file.size > MAX_BYTES) {
    throw new AppError(
      400,
      "IMAGE_TOO_LARGE",
      "Image must be 5MB or smaller"
    );
  }
}

async function uploadLocal(file: Express.Multer.File) {
  // Store under the API so Express can serve immediately.
  // Writing into Next public/ after `next start` leaves files invisible until restart.
  const dir = localProductUploadDir();
  await fs.mkdir(dir, { recursive: true });
  const ext =
    file.mimetype === "image/png"
      ? ".png"
      : file.mimetype === "image/webp"
        ? ".webp"
        : ".jpg";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const absolute = path.join(dir, filename);
  await fs.writeFile(absolute, file.buffer);
  return {
    url: `/uploads/products/${filename}`,
    publicId: filename,
    provider: "local" as const,
  };
}

async function uploadCloudinary(file: Express.Multer.File) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ookf/products",
        resource_type: "image",
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          secure_url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });
      }
    );
    stream.end(file.buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    provider: "cloudinary" as const,
  };
}

export async function uploadProductImages(files: Express.Multer.File[]) {
  if (!files.length) {
    throw new AppError(400, "NO_FILES", "At least one image file is required");
  }
  if (files.length > 6) {
    throw new AppError(
      400,
      "TOO_MANY_IMAGES",
      "Upload at most 6 images at a time"
    );
  }

  const uploaded = [];
  for (const file of files) {
    assertImageFile(file);
    const result = env.integrations.cloudinaryConfigured
      ? await uploadCloudinary(file)
      : await uploadLocal(file);
    uploaded.push({
      url: result.url,
      publicId: result.publicId,
      provider: result.provider,
      alt: "",
    });
  }

  return uploaded;
}
