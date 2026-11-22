import { Router } from "express";
import {
  authRateLimiter,
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
} from "../controllers/auth.controller";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, asyncHandler(registerHandler));
authRouter.post("/login", authRateLimiter, asyncHandler(loginHandler));
authRouter.post("/logout", asyncHandler(logoutHandler));
authRouter.get("/me", asyncHandler(meHandler));
