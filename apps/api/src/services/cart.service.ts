import { cartItemSchema } from "@ookf/shared";
import { Types } from "mongoose";
import { CartModel } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { AppError } from "../utils/app-error";
import { validateCouponForCart } from "./coupon-validation.service";

function availableStock(variant: {
  stockQuantity: number;
  reservedQuantity?: number;
}) {
  return Math.max(0, variant.stockQuantity - (variant.reservedQuantity ?? 0));
}

async function getOrCreateCart(identity: {
  userId?: string;
  guestId?: string;
}) {
  if (!identity.userId && !identity.guestId) {
    throw new AppError(400, "CART_IDENTITY_REQUIRED", "Cart identity required");
  }

  const filter = identity.userId
    ? { userId: identity.userId }
    : { guestId: identity.guestId };

  let cart = await CartModel.findOne(filter);
  if (!cart) {
    cart = await CartModel.create(filter);
  }
  return cart;
}

export async function getCart(identity: { userId?: string; guestId?: string }) {
  const cart = await getOrCreateCart(identity);
  return hydrateCart(cart.id);
}

export async function addToCart(
  identity: { userId?: string; guestId?: string },
  input: unknown
) {
  const data = cartItemSchema.parse(input);
  if (!Types.ObjectId.isValid(data.productId) || !Types.ObjectId.isValid(data.variantId)) {
    throw new AppError(400, "INVALID_ID", "Invalid product or variant id");
  }

  const product = await ProductModel.findOne({
    _id: data.productId,
    deletedAt: null,
    status: "published",
  });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const variant = product.variants.id(data.variantId);
  if (!variant || !(variant.isAvailable ?? true)) {
    throw new AppError(400, "VARIANT_UNAVAILABLE", "Variant unavailable");
  }

  const stock = availableStock(variant);
  if (data.quantity > stock && !product.allowBackorder) {
    throw new AppError(409, "INSUFFICIENT_STOCK", "Not enough stock for this variant");
  }

  const cart = await getOrCreateCart(identity);
  const existing = cart.items.find(
    (item) =>
      String(item.productId) === data.productId &&
      String(item.variantId) === data.variantId
  );

  if (existing) {
    const nextQty = existing.quantity + data.quantity;
    if (nextQty > stock && !product.allowBackorder) {
      throw new AppError(409, "INSUFFICIENT_STOCK", "Not enough stock for this variant");
    }
    existing.quantity = nextQty;
  } else {
    cart.items.push({
      productId: new Types.ObjectId(data.productId),
      variantId: new Types.ObjectId(data.variantId),
      quantity: data.quantity,
    });
  }

  await cart.save();
  return hydrateCart(cart.id);
}

function findCartItem(
  cart: Awaited<ReturnType<typeof getOrCreateCart>>,
  itemId: string
) {
  return (
    cart.items.id(itemId) ??
    cart.items.find((entry) => String(entry._id) === String(itemId)) ??
    null
  );
}

async function getExistingCart(identity: {
  userId?: string;
  guestId?: string;
}) {
  if (!identity.userId && !identity.guestId) {
    throw new AppError(400, "CART_IDENTITY_REQUIRED", "Cart identity required");
  }
  const filter = identity.userId
    ? { userId: identity.userId }
    : { guestId: identity.guestId };
  const cart = await CartModel.findOne(filter);
  if (!cart) {
    throw new AppError(404, "CART_NOT_FOUND", "Cart not found");
  }
  return cart;
}

export async function updateCartItem(
  identity: { userId?: string; guestId?: string },
  itemId: string,
  quantity: number
) {
  if (quantity < 1 || quantity > 99) {
    throw new AppError(400, "INVALID_QUANTITY", "Quantity must be between 1 and 99");
  }

  const cart = await getExistingCart(identity);
  const item = findCartItem(cart, itemId);
  if (!item) {
    throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  const product = await ProductModel.findById(item.productId);
  const variant = product?.variants.id(String(item.variantId));
  if (!product || !variant) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product no longer available");
  }

  const stock = availableStock(variant);
  if (quantity > stock && !product.allowBackorder) {
    throw new AppError(409, "INSUFFICIENT_STOCK", "Not enough stock for this variant");
  }

  // No-op when quantity is unchanged — avoids spurious PATCH races from the UI.
  if (item.quantity === quantity) {
    return hydrateCart(cart.id);
  }

  item.quantity = quantity;
  await cart.save();
  return hydrateCart(cart.id);
}

export async function removeCartItem(
  identity: { userId?: string; guestId?: string },
  itemId: string
) {
  const cart = await getExistingCart(identity);
  const item = findCartItem(cart, itemId);
  if (!item) {
    throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }
  item.deleteOne();
  await cart.save();
  return hydrateCart(cart.id);
}

export async function mergeGuestCart(userId: string, guestId?: string) {
  if (!guestId) return getCart({ userId });

  const guestCart = await CartModel.findOne({ guestId });
  const userCart = await getOrCreateCart({ userId });

  if (!guestCart) return hydrateCart(userCart.id);

  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (item) =>
        String(item.productId) === String(guestItem.productId) &&
        String(item.variantId) === String(guestItem.variantId)
    );
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + guestItem.quantity);
    } else {
      userCart.items.push({
        productId: guestItem.productId,
        variantId: guestItem.variantId,
        quantity: guestItem.quantity,
      });
    }
  }

  await userCart.save();
  await guestCart.deleteOne();
  return hydrateCart(userCart.id);
}

export async function applyCoupon(
  identity: { userId?: string; guestId?: string },
  code: string
) {
  const cart = await getOrCreateCart(identity);
  const lines = await buildCouponLines(cart.id);

  const result = await validateCouponForCart({
    code,
    lines,
    userId: identity.userId,
  });

  cart.couponCode = result.couponCode ?? undefined;
  await cart.save();
  return hydrateCart(cart.id);
}

async function buildCouponLines(cartId: string) {
  const cart = await CartModel.findById(cartId);
  if (!cart) return [];
  const lines = [];
  for (const item of cart.items) {
    const product = await ProductModel.findById(item.productId)
      .select("categoryId variants priceCents")
      .lean();
    if (!product) continue;
    const variant = product.variants.find(
      (entry) => String(entry._id) === String(item.variantId)
    );
    if (!variant) continue;
    const unitPriceCents = variant.priceCents ?? product.priceCents;
    lines.push({
      productId: String(product._id),
      categoryId: product.categoryId ? String(product.categoryId) : null,
      lineTotalCents: unitPriceCents * item.quantity,
    });
  }
  return lines;
}

export async function removeCoupon(identity: {
  userId?: string;
  guestId?: string;
}) {
  const cart = await getOrCreateCart(identity);
  cart.couponCode = undefined;
  await cart.save();
  return hydrateCart(cart.id);
}

async function hydrateCart(cartId: string) {
  const cart = await CartModel.findById(cartId);
  if (!cart) {
    throw new AppError(404, "CART_NOT_FOUND", "Cart not found");
  }

  const lines = [];
  let subtotalCents = 0;

  for (const item of cart.items) {
    const product = await ProductModel.findById(item.productId).lean();
    if (!product) continue;
    const variant = product.variants.find(
      (entry) => String(entry._id) === String(item.variantId)
    );
    if (!variant) continue;

    const unitPriceCents = variant.priceCents ?? product.priceCents;
    const lineTotalCents = unitPriceCents * item.quantity;
    subtotalCents += lineTotalCents;

    lines.push({
      id: String(item._id),
      productId: String(product._id),
      variantId: String(variant._id),
      name: product.name,
      slug: product.slug,
      sku: variant.sku,
      options: variant.options,
      quantity: item.quantity,
      unitPriceCents,
      lineTotalCents,
      imageUrl: variant.imageUrl ?? product.images?.[0]?.url ?? null,
      maxQuantity: availableStock(variant),
    });
  }

  const couponLines = await buildCouponLines(cartId);
  const resolved = cart.couponCode
    ? await validateCouponForCart({
        code: cart.couponCode,
        lines: couponLines,
        soft: true,
      })
    : { couponCode: null, discountCents: 0 };
  const couponCode = resolved.couponCode;
  const discountCents = resolved.discountCents;

  // Drop stale coupon codes that are no longer valid.
  if (cart.couponCode && !couponCode) {
    cart.couponCode = undefined;
    await cart.save();
  }

  return {
    id: String(cart._id),
    items: lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents,
    discountCents,
    totalCents: Math.max(0, subtotalCents - discountCents),
    currency: "CAD" as const,
    couponCode,
  };
}
