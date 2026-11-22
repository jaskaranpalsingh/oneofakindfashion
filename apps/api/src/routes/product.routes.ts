import { Router } from "express";
import {
  getProductHandler,
  listProductsHandler,
} from "../controllers/product.controller";
import { asyncHandler } from "../utils/async-handler";

export const productRouter = Router();

productRouter.get("/", asyncHandler(listProductsHandler));
productRouter.get("/:slug", asyncHandler(getProductHandler));
