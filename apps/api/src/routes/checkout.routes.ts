import { Router } from "express";
import {
  buyNowHandler,
  cancelCheckoutHandler,
  createCheckoutHandler,
  getCheckoutSuccessHandler,
} from "../controllers/checkout.controller";
import { asyncHandler } from "../utils/async-handler";

export const checkoutRouter = Router();

checkoutRouter.post("/", asyncHandler(createCheckoutHandler));
checkoutRouter.post("/buy-now", asyncHandler(buyNowHandler));
checkoutRouter.get("/success", asyncHandler(getCheckoutSuccessHandler));
checkoutRouter.post("/cancel", asyncHandler(cancelCheckoutHandler));
