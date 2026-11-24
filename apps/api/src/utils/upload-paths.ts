import path from "node:path";

/**
 * Durable local product upload directory (API-owned).
 * Served by Express at /uploads/products so Next production
 * does not need a restart to see newly uploaded files.
 *
 * Assumes the API process cwd is apps/api (pnpm filter / package scripts).
 */
export function localProductUploadDir() {
  return path.resolve(process.cwd(), "uploads/products");
}

/** Legacy Next public folder used by earlier local uploads. */
export function legacyWebPublicUploadDir() {
  return path.resolve(process.cwd(), "../web/public/uploads/products");
}
