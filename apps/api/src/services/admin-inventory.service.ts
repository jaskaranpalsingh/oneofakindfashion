import { InventoryAdjustmentType } from "@ookf/shared";
import { Types } from "mongoose";
import { InventoryAdjustmentModel } from "../models/inventory-adjustment.model";
import { ProductModel } from "../models/product.model";
import { AppError } from "../utils/app-error";

function availableStock(variant: {
  stockQuantity?: number;
  reservedQuantity?: number;
}) {
  return Math.max(
    0,
    (variant.stockQuantity ?? 0) - (variant.reservedQuantity ?? 0)
  );
}

export async function listInventory(options?: { q?: string }) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (options?.q?.trim()) {
    const q = options.q.trim();
    filter.$or = [
      { name: new RegExp(q, "i") },
      { sku: new RegExp(q, "i") },
      { "variants.sku": new RegExp(q, "i") },
    ];
  }

  const products = await ProductModel.find(filter)
    .select("name slug sku status lowStockThreshold variants")
    .sort({ name: 1 })
    .lean();

  const rows = [];
  let totalSkus = 0;
  let availableUnits = 0;
  let lowStockSkus = 0;
  let outOfStockSkus = 0;

  for (const product of products) {
    const threshold = product.lowStockThreshold ?? 3;
    for (const variant of product.variants ?? []) {
      totalSkus += 1;
      const available = availableStock(variant);
      availableUnits += available;
      if (available <= 0 || !(variant.isAvailable ?? true)) {
        outOfStockSkus += 1;
      } else if (available <= threshold) {
        lowStockSkus += 1;
      }

      rows.push({
        productId: String(product._id),
        productName: product.name,
        productSlug: product.slug,
        productSku: product.sku,
        variantId: String(variant._id),
        variantSku: variant.sku,
        options: variant.options ?? {},
        stockQuantity: variant.stockQuantity ?? 0,
        reservedQuantity: variant.reservedQuantity ?? 0,
        availableQuantity: available,
        isAvailable: variant.isAvailable ?? true,
        lowStockThreshold: threshold,
        status:
          available <= 0
            ? "out_of_stock"
            : available <= threshold
              ? "low_stock"
              : "in_stock",
      });
    }
  }

  return {
    summary: {
      totalSkus,
      availableUnits,
      lowStockSkus,
      outOfStockSkus,
    },
    items: rows,
  };
}

export async function adjustInventory(input: {
  productId: string;
  variantId: string;
  /** Legacy delta API. Prefer mode + quantity. */
  quantityDelta?: number;
  mode?: "set" | "add" | "remove";
  quantity?: number;
  reason?: string;
  actorUserId?: string;
  type?: InventoryAdjustmentType;
}) {
  if (!Types.ObjectId.isValid(input.productId)) {
    throw new AppError(400, "INVALID_ID", "Invalid product id");
  }
  if (!Types.ObjectId.isValid(input.variantId)) {
    throw new AppError(400, "INVALID_ID", "Invalid variant id");
  }

  const product = await ProductModel.findOne({
    _id: input.productId,
    deletedAt: null,
  });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const variant = product.variants.id(input.variantId);
  if (!variant) {
    throw new AppError(404, "VARIANT_NOT_FOUND", "Variant not found");
  }

  const current = variant.stockQuantity ?? 0;
  const reserved = variant.reservedQuantity ?? 0;
  let quantityDelta = 0;

  if (input.mode) {
    if (!Number.isInteger(input.quantity) || (input.quantity ?? 0) < 0) {
      throw new AppError(
        400,
        "INVALID_QUANTITY",
        "quantity must be a non-negative whole number"
      );
    }
    const qty = input.quantity ?? 0;
    if (input.mode === "set") {
      quantityDelta = qty - current;
    } else if (input.mode === "add") {
      quantityDelta = qty;
    } else {
      quantityDelta = -qty;
    }
  } else {
    if (!Number.isInteger(input.quantityDelta) || input.quantityDelta === 0) {
      throw new AppError(
        400,
        "INVALID_DELTA",
        "quantityDelta must be a non-zero integer"
      );
    }
    quantityDelta = input.quantityDelta!;
  }

  if (quantityDelta === 0) {
    throw new AppError(400, "NO_CHANGE", "Stock is already at that level");
  }

  const nextStock = current + quantityDelta;
  if (nextStock < 0) {
    throw new AppError(
      400,
      "NEGATIVE_STOCK",
      "Adjustment would make stock negative"
    );
  }
  if (nextStock < reserved) {
    throw new AppError(
      400,
      "BELOW_RESERVED",
      `Cannot set stock below reserved quantity (${reserved})`
    );
  }

  variant.stockQuantity = nextStock;
  await product.save();

  const adjustmentType =
    input.type ??
    (quantityDelta > 0
      ? InventoryAdjustmentType.RESTOCK
      : InventoryAdjustmentType.MANUAL);

  await InventoryAdjustmentModel.create({
    productId: product._id,
    variantId: variant._id,
    sku: variant.sku,
    type: adjustmentType,
    quantityDelta,
    quantityAfter: nextStock,
    reason: input.reason,
    actorUserId: input.actorUserId
      ? new Types.ObjectId(input.actorUserId)
      : undefined,
  });

  return {
    productId: String(product._id),
    variantId: String(variant._id),
    sku: variant.sku,
    previousStock: current,
    stockQuantity: nextStock,
    reservedQuantity: reserved,
    availableQuantity: availableStock(variant),
    quantityDelta,
  };
}

export async function listInventoryAdjustments(options?: {
  limit?: number;
  productId?: string;
  variantId?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (options?.productId && Types.ObjectId.isValid(options.productId)) {
    filter.productId = options.productId;
  }
  if (options?.variantId && Types.ObjectId.isValid(options.variantId)) {
    filter.variantId = options.variantId;
  }

  const rows = await InventoryAdjustmentModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(options?.limit ?? 30, 1), 100))
    .lean();

  return rows.map((row) => ({
    id: String(row._id),
    productId: String(row.productId),
    variantId: String(row.variantId),
    sku: row.sku,
    type: row.type,
    quantityDelta: row.quantityDelta,
    quantityAfter: row.quantityAfter,
    reason: row.reason ?? null,
    orderId: row.orderId ? String(row.orderId) : null,
    createdAt: row.createdAt,
  }));
}
