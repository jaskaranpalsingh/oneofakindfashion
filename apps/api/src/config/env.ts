import { config as loadEnv } from "dotenv";
import path from "node:path";
import { z } from "zod";

// Load monorepo root .env first, then local overrides.
loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  // Comma-separated storefront origins, e.g. http://localhost:3000,http://192.168.1.43:3000
  WEB_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  MONGODB_URI: z
    .string()
    .min(1)
    .default("mongodb://127.0.0.1:27017/one-of-a-kind-fashion"),
  SESSION_SECRET: z
    .string()
    .min(32)
    .default("dev-only-change-me-session-secret-32chars"),
  COOKIE_NAME: z.string().default("ookf_session"),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  EMAIL_PROVIDER_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  ADMIN_INITIAL_EMAIL: z.string().email().optional(),
  ADMIN_INITIAL_PASSWORD: z.string().min(8).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten());
  process.exit(1);
}

const webOrigins = parsed.data.WEB_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  ...parsed.data,
  /** Primary storefront origin (Stripe redirects, etc.) */
  WEB_ORIGIN: webOrigins[0] ?? "http://localhost:3000",
  /** All allowed storefront origins for CORS */
  webOrigins,
  isDev: parsed.data.NODE_ENV === "development",
  isProd: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  cookieSecure:
    parsed.data.COOKIE_SECURE ?? parsed.data.NODE_ENV === "production",
  integrations: {
    stripeConfigured: Boolean(
      parsed.data.STRIPE_SECRET_KEY && parsed.data.STRIPE_WEBHOOK_SECRET
    ),
    cloudinaryConfigured: Boolean(
      parsed.data.CLOUDINARY_CLOUD_NAME &&
        parsed.data.CLOUDINARY_API_KEY &&
        parsed.data.CLOUDINARY_API_SECRET
    ),
    emailConfigured: Boolean(
      parsed.data.EMAIL_PROVIDER_KEY && parsed.data.EMAIL_FROM
    ),
  },
};

/** Allow localhost + private LAN hosts while developing (phone/tablet preview). */
export function isDevLanOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return true;
    }
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

export function isAllowedWebOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (env.webOrigins.includes(origin)) return true;
  if (env.isDev && isDevLanOrigin(origin)) return true;
  return false;
}
