import { FulfillmentStatus, PaymentStatus } from "@ookf/shared";
import { Types } from "mongoose";
import { savedAddressSchema } from "@ookf/shared";
import { OrderModel } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { getUserById } from "./auth.service";

const PAID = [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED];
const ACTIVE_FULFILLMENT = [
  FulfillmentStatus.PENDING_PAYMENT,
  FulfillmentStatus.AWAITING_FULFILLMENT,
  FulfillmentStatus.PROCESSING,
  FulfillmentStatus.PACKED,
  FulfillmentStatus.SHIPPED,
  FulfillmentStatus.IN_TRANSIT,
  FulfillmentStatus.OUT_FOR_DELIVERY,
  FulfillmentStatus.PREPARING_PICKUP,
  FulfillmentStatus.READY_FOR_PICKUP,
];

function mapAddress(address: Record<string, unknown>) {
  return {
    id: String(address._id),
    label: (address.label as string | undefined) ?? null,
    firstName: address.firstName as string,
    lastName: address.lastName as string,
    company: (address.company as string | undefined) ?? null,
    line1: address.line1 as string,
    line2: (address.line2 as string | undefined) ?? null,
    city: address.city as string,
    province: address.province as string,
    postalCode: address.postalCode as string,
    country: (address.country as string | undefined) ?? "Canada",
    phone: (address.phone as string | undefined) ?? null,
    isDefaultShipping: Boolean(
      address.isDefaultShipping || address.isDefault
    ),
    isDefaultBilling: Boolean(address.isDefaultBilling),
  };
}

export async function getAccountOverview(userId: string) {
  const user = await UserModel.findOne({ _id: userId, deletedAt: null }).lean();
  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "Account not found");
  }

  const [totalOrders, activeOrders, deliveredOrders, recentOrders] =
    await Promise.all([
      OrderModel.countDocuments({ userId }),
      OrderModel.countDocuments({
        userId,
        fulfillmentStatus: { $in: ACTIVE_FULFILLMENT },
        paymentStatus: { $nin: [PaymentStatus.CANCELLED] },
      }),
      OrderModel.countDocuments({
        userId,
        fulfillmentStatus: {
          $in: [FulfillmentStatus.DELIVERED, FulfillmentStatus.COLLECTED],
        },
      }),
      OrderModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "orderNumber createdAt totals paymentStatus fulfillmentStatus trackingNumber shippingCarrier"
        )
        .lean(),
    ]);

  const addresses = (user.addresses ?? []).map((address) =>
    mapAddress(address as unknown as Record<string, unknown>)
  );
  const defaultShipping =
    addresses.find((address) => address.isDefaultShipping) ??
    addresses[0] ??
    null;

  return {
    user: await getUserById(userId),
    stats: {
      totalOrders,
      activeOrders,
      deliveredOrders,
      wishlistCount: user.wishlistProductIds?.length ?? 0,
      addressCount: addresses.length,
    },
    defaultShippingAddress: defaultShipping,
    recentOrders: recentOrders.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      totalCents: order.totals?.totalCents ?? 0,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      trackingNumber: order.trackingNumber ?? null,
      shippingCarrier: order.shippingCarrier ?? null,
    })),
  };
}

export async function listAddresses(userId: string) {
  const user = await UserModel.findOne({ _id: userId, deletedAt: null }).lean();
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found");
  return (user.addresses ?? []).map((address) =>
    mapAddress(address as unknown as Record<string, unknown>)
  );
}

export async function createAddress(userId: string, input: unknown) {
  const data = savedAddressSchema.parse(input);
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found");

  const makeDefaultShipping =
    data.isDefaultShipping || user.addresses.length === 0;
  const makeDefaultBilling = Boolean(data.isDefaultBilling);

  if (makeDefaultShipping) {
    for (const address of user.addresses) {
      address.isDefaultShipping = false;
      address.isDefault = false;
    }
  }
  if (makeDefaultBilling) {
    for (const address of user.addresses) {
      address.isDefaultBilling = false;
    }
  }

  user.addresses.push({
    ...data,
    country: data.country ?? "Canada",
    isDefaultShipping: makeDefaultShipping,
    isDefaultBilling: makeDefaultBilling,
    isDefault: makeDefaultShipping,
  } as never);
  await user.save();

  const created = user.addresses[user.addresses.length - 1];
  return mapAddress(created.toObject() as Record<string, unknown>);
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: unknown
) {
  if (!Types.ObjectId.isValid(addressId)) {
    throw new AppError(400, "INVALID_ID", "Invalid address id");
  }
  const data = savedAddressSchema.partial().parse(input);
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found");

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found");
  }

  Object.assign(address, {
    ...data,
    country: data.country ?? address.country ?? "Canada",
  });

  if (data.isDefaultShipping) {
    for (const item of user.addresses) {
      const isTarget = String(item._id) === addressId;
      item.isDefaultShipping = isTarget;
      item.isDefault = isTarget;
    }
  }
  if (data.isDefaultBilling) {
    for (const item of user.addresses) {
      item.isDefaultBilling = String(item._id) === addressId;
    }
  }

  await user.save();
  return mapAddress(address.toObject() as Record<string, unknown>);
}

export async function deleteAddress(userId: string, addressId: string) {
  if (!Types.ObjectId.isValid(addressId)) {
    throw new AppError(400, "INVALID_ID", "Invalid address id");
  }
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found");

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found");
  }

  const wasDefault = Boolean(address.isDefaultShipping || address.isDefault);
  address.deleteOne();
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefaultShipping = true;
    user.addresses[0].isDefault = true;
  }
  await user.save();
  return { deleted: true };
}

export async function getWishlist(userId: string) {
  const user = await UserModel.findOne({ _id: userId, deletedAt: null })
    .select("wishlistProductIds")
    .lean();
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found");

  const ids = (user.wishlistProductIds ?? []).map((id) => String(id));
  if (ids.length === 0) return { ids: [], products: [] };

  const products = await ProductModel.find({
    _id: { $in: ids },
    deletedAt: null,
    status: "published",
  })
    .select("name slug priceCents compareAtPriceCents images status")
    .lean();

  const byId = new Map(products.map((product) => [String(product._id), product]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((product) => {
      const images = (product!.images as Array<{ url?: string; isPrimary?: boolean }>) ?? [];
      const primary =
        images.find((image) => image.isPrimary)?.url ?? images[0]?.url ?? null;
      return {
        id: String(product!._id),
        name: product!.name,
        slug: product!.slug,
        priceCents: product!.priceCents,
        compareAtPriceCents: product!.compareAtPriceCents ?? null,
        imageUrl: primary,
      };
    });

  return { ids, products: ordered };
}

export async function addWishlistItem(userId: string, productId: string) {
  if (!Types.ObjectId.isValid(productId)) {
    throw new AppError(400, "INVALID_ID", "Invalid product id");
  }
  const product = await ProductModel.exists({
    _id: productId,
    deletedAt: null,
  });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  await UserModel.updateOne(
    { _id: userId, deletedAt: null },
    { $addToSet: { wishlistProductIds: productId } }
  );
  return getWishlist(userId);
}

export async function removeWishlistItem(userId: string, productId: string) {
  if (!Types.ObjectId.isValid(productId)) {
    throw new AppError(400, "INVALID_ID", "Invalid product id");
  }
  await UserModel.updateOne(
    { _id: userId, deletedAt: null },
    { $pull: { wishlistProductIds: productId } }
  );
  return getWishlist(userId);
}

export async function syncWishlist(userId: string, productIds: string[]) {
  const validIds = [
    ...new Set(
      productIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => id)
    ),
  ];
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found");

  const existing = new Set(
    (user.wishlistProductIds ?? []).map((id) => String(id))
  );
  for (const id of validIds) existing.add(id);
  user.wishlistProductIds = [...existing].map(
    (id) => new Types.ObjectId(id)
  ) as never;
  await user.save();
  return getWishlist(userId);
}

export async function getCheckoutProfile(userId: string) {
  const user = await UserModel.findOne({ _id: userId, deletedAt: null }).lean();
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found");

  const addresses = (user.addresses ?? []).map((address) =>
    mapAddress(address as unknown as Record<string, unknown>)
  );
  const shipping =
    addresses.find((address) => address.isDefaultShipping) ??
    addresses[0] ??
    null;
  const billing =
    addresses.find((address) => address.isDefaultBilling) ?? shipping;

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    shippingAddress: shipping,
    billingAddress: billing,
    addresses,
  };
}
