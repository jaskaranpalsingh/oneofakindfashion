import { Router } from "express";
import {
  authRateLimiter,
  changePasswordHandler,
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  passwordResetRateLimiter,
  registerHandler,
  requestDeletionHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  updateProfileHandler,
  verifyEmailHandler,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, asyncHandler(registerHandler));
authRouter.post("/login", authRateLimiter, asyncHandler(loginHandler));
authRouter.post("/logout", asyncHandler(logoutHandler));
authRouter.get("/me", asyncHandler(meHandler));

authRouter.patch(
  "/profile",
  requireAuth,
  asyncHandler(updateProfileHandler)
);
authRouter.post(
  "/change-password",
  requireAuth,
  asyncHandler(changePasswordHandler)
);
authRouter.post(
  "/forgot-password",
  passwordResetRateLimiter,
  asyncHandler(forgotPasswordHandler)
);
authRouter.post(
  "/reset-password",
  passwordResetRateLimiter,
  asyncHandler(resetPasswordHandler)
);
authRouter.post("/verify-email", asyncHandler(verifyEmailHandler));
authRouter.post(
  "/resend-verification",
  requireAuth,
  asyncHandler(resendVerificationHandler)
);
authRouter.post(
  "/request-deletion",
  requireAuth,
  asyncHandler(requestDeletionHandler)
);
