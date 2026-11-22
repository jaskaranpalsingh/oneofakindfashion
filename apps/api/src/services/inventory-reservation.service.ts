import { InventoryAdjustmentType } from "@ookf/shared";
import { Types } from "mongoose";
import { InventoryAdjustmentModel } from "../models/inventory-adjustment.model";
import { ProductModel } from "../models/product.model";
import { AppError } from "../utils/app-error";

type Line = {
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
};

export async function reserveInventoryForOrder(
  orderId: string,
  lines: Line[]
) {
  for (const line of lines) {
    const product = await ProductModel.findById(line.productId);
    const variant = product?.variants.id(line.variantId);
    if (!product || !variant) {
      throw new AppError(409, "INVENTORY_ERROR", "Unable to reserve inventory");
    }

    const available =
      variant.stockQuantity - (variant.reservedQuantity ?? 0);
    if (available < line.quantity && !product.allowBackorder) {
      throw new AppError(
        409,
        "INSUFFICIENT_STOCK",
        `Insufficient stock for ${line.sku}`
      );
    }

    variant.reservedQuantity = (variant.reservedQuantity ?? 0) + line.quantity;
    await product.save();

    await InventoryAdjustmentModel.create({
      productId: new Types.ObjectId(line.productId),
      variantId: new Types.ObjectId(line.variantId),
      sku: line.sku,
      type: InventoryAdjustmentType.RESERVE,
      quantityDelta: -line.quantity,
      quantityAfter: Math.max(
        0,
        variant.stockQuantity - (variant.reservedQuantity ?? 0)
      ),
      reason: "Checkout reservation",
      orderId: new Types.ObjectId(orderId),
    });
  }
}

export async function releaseInventoryForOrder(
  orderId: string,
  lines: Line[]
) {
  for (const line of lines) {
    const product = await ProductModel.findById(line.productId);
    const variant = product?.variants.id(line.variantId);
    if (!product || !variant) continue;

    variant.reservedQuantity = Math.max(
      0,
      (variant.reservedQuantity ?? 0) - line.quantity
    );
    await product.save();

    await InventoryAdjustmentModel.create({
      productId: new Types.ObjectId(line.productId),
      variantId: new Types.ObjectId(line.variantId),
      sku: line.sku,
      type: InventoryAdjustmentType.RELEASE,
      quantityDelta: line.quantity,
      quantityAfter: Math.max(
        0,
        variant.stockQuantity - (variant.reservedQuantity ?? 0)
      ),
      reason: "Checkout cancelled or expired",
      orderId: new Types.ObjectId(orderId),
    });
  }
}

export async function commitInventoryForOrder(
  orderId: string,
  lines: Line[]
) {
  for (const line of lines) {
    const product = await ProductModel.findById(line.productId);
    const variant = product?.variants.id(line.variantId);
    if (!product || !variant) {
      throw new AppError(409, "INVENTORY_ERROR", "Unable to commit inventory");
    }

    if ((variant.reservedQuantity ?? 0) >= line.quantity) {
      variant.reservedQuantity -= line.quantity;
    }
    if (variant.stockQuantity < line.quantity) {
      throw new AppError(
        409,
        "INSUFFICIENT_STOCK",
        "Insufficient stock at payment time"
      );
    }
    variant.stockQuantity -= line.quantity;
    product.salesCount = (product.salesCount ?? 0) + line.quantity;
    await product.save();

    await InventoryAdjustmentModel.create({
      productId: new Types.ObjectId(line.productId),
      variantId: new Types.ObjectId(line.variantId),
      sku: line.sku,
      type: InventoryAdjustmentType.SALE,
      quantityDelta: -line.quantity,
      quantityAfter: Math.max(
        0,
        variant.stockQuantity - (variant.reservedQuantity ?? 0)
      ),
      reason: "Payment verified",
      orderId: new Types.ObjectId(orderId),
    });
  }
}
