import type { Request, Response } from "express";
import {
  archiveCategory,
  createCategory,
  getCategoryBySlug,
  listCategories,
  toCategoryDto,
  updateCategory,
} from "../services/category.service";
import { sendSuccess } from "../utils/api-response";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validators";

export async function listCategoriesHandler(req: Request, res: Response) {
  const includeHidden = req.query.includeHidden === "true";
  const parentId =
    req.query.parentId === "null"
      ? null
      : typeof req.query.parentId === "string"
        ? req.query.parentId
        : undefined;

  const categories = await listCategories({ includeHidden, parentId });
  return sendSuccess(res, categories.map(toCategoryDto));
}

export async function getCategoryHandler(req: Request, res: Response) {
  const category = await getCategoryBySlug(req.params.slug);
  return sendSuccess(res, toCategoryDto(category));
}

export async function createCategoryHandler(req: Request, res: Response) {
  const input = createCategorySchema.parse(req.body);
  const category = await createCategory(input);
  return sendSuccess(res, toCategoryDto(category.toObject()), 201);
}

export async function updateCategoryHandler(req: Request, res: Response) {
  const input = updateCategorySchema.parse(req.body);
  const category = await updateCategory(req.params.id, input);
  return sendSuccess(res, toCategoryDto(category.toObject()));
}

export async function archiveCategoryHandler(req: Request, res: Response) {
  const result = await archiveCategory(req.params.id);
  return sendSuccess(res, result);
}
