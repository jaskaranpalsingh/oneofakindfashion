import { Router } from "express";
import {
  getCategoryHandler,
  listCategoriesHandler,
} from "../controllers/category.controller";
import { asyncHandler } from "../utils/async-handler";

export const categoryRouter = Router();

categoryRouter.get("/", asyncHandler(listCategoriesHandler));
categoryRouter.get("/:slug", asyncHandler(getCategoryHandler));
