import { Router } from "express";
import {
  buyNowHandler,
  cancelCheckoutHandler,
  createCheckoutHandler,
  getCheckoutSuccessHandler,
  quoteCheckoutHandler,
} from "../controllers/checkout.controller";
import { asyncHandler } from "../utils/async-handler";

export const checkoutRouter = Router();

checkoutRouter.post("/quote", asyncHandler(quoteCheckoutHandler));
checkoutRouter.post("/", asyncHandler(createCheckoutHandler));
checkoutRouter.post("/buy-now", asyncHandler(buyNowHandler));
checkoutRouter.get("/success", asyncHandler(getCheckoutSuccessHandler));
checkoutRouter.post("/cancel", asyncHandler(cancelCheckoutHandler));
