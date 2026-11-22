import MongoStore from "connect-mongo";
import session from "express-session";
import { env } from "./env";

export function createSessionMiddleware() {
  return session({
    name: env.COOKIE_NAME,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: env.MONGODB_URI,
      ttl: 60 * 60 * 24 * 14,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: env.cookieSecure,
      // Lax works for same-site localhost:3000 ↔ localhost:4000 API calls.
      // In production (cross-site), use SameSite=None + Secure.
      sameSite: env.isProd ? "none" : "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 14,
    },
  });
}
