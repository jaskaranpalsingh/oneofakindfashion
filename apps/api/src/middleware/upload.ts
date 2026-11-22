import multer from "multer";
import { AppError } from "../utils/app-error";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 12,
  },
  fileFilter(_req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(
        new AppError(
          400,
          "INVALID_IMAGE_TYPE",
          "Only JPEG, PNG, and WebP images are allowed"
        ) as unknown as Error
      );
      return;
    }
    callback(null, true);
  },
});
