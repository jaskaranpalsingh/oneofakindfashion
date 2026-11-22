import { Router } from "express";
import {
  getMyOrderHandler,
  listMyOrdersHandler,
  lookupGuestOrderHandler,
} from "../controllers/customer-order.controller";
import { asyncHandler } from "../utils/async-handler";

export const orderRouter = Router();

orderRouter.get("/mine", asyncHandler(listMyOrdersHandler));
orderRouter.get("/mine/:orderNumber", asyncHandler(getMyOrderHandler));
orderRouter.post("/lookup", asyncHandler(lookupGuestOrderHandler));
