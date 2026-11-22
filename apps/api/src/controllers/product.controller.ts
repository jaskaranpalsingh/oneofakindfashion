import type { Request, Response } from "express";
import {
  archiveProduct,
  createProduct,
  getAdminProductById,
  getProductBySlug,
  listAdminProducts,
  listProducts,
  updateProduct,
} from "../services/product.service";
import { sendSuccess } from "../utils/api-response";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validators";

export async function listProductsHandler(req: Request, res: Response) {
  const result = await listProducts(req.query as Record<string, unknown>);
  return sendSuccess(res, result.items, 200, result.meta);
}

export async function listAdminProductsHandler(req: Request, res: Response) {
  const result = await listAdminProducts({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    categoryId:
      typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  });
  return sendSuccess(res, result.items, 200, result.meta);
}

export async function getProductHandler(req: Request, res: Response) {
  const product = await getProductBySlug(req.params.slug);
  return sendSuccess(res, product);
}

export async function getAdminProductHandler(req: Request, res: Response) {
  const product = await getAdminProductById(req.params.id);
  return sendSuccess(res, product);
}

export async function createProductHandler(req: Request, res: Response) {
  const input = createProductSchema.parse(req.body);
  const product = await createProduct(input);
  return sendSuccess(res, product, 201);
}

export async function updateProductHandler(req: Request, res: Response) {
  const input = updateProductSchema.parse(req.body);
  const product = await updateProduct(req.params.id, input);
  return sendSuccess(res, product);
}

export async function archiveProductHandler(req: Request, res: Response) {
  const result = await archiveProduct(req.params.id);
  return sendSuccess(res, result);
}
