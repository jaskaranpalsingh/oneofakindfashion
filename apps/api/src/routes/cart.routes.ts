import { Router } from "express";
import {
  addCartItemHandler,
  applyCouponHandler,
  getCartHandler,
  mergeCartHandler,
  removeCartItemHandler,
  removeCouponHandler,
  updateCartItemHandler,
} from "../controllers/cart.controller";
import { asyncHandler } from "../utils/async-handler";

export const cartRouter = Router();

cartRouter.get("/", asyncHandler(getCartHandler));
cartRouter.post("/items", asyncHandler(addCartItemHandler));
cartRouter.patch("/items/:itemId", asyncHandler(updateCartItemHandler));
cartRouter.delete("/items/:itemId", asyncHandler(removeCartItemHandler));
cartRouter.post("/coupon", asyncHandler(applyCouponHandler));
cartRouter.delete("/coupon", asyncHandler(removeCouponHandler));
cartRouter.post("/merge", asyncHandler(mergeCartHandler));
