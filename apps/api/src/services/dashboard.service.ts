import {
  FulfillmentStatus,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from "@ookf/shared";
import { CategoryModel } from "../models/category.model";
import { OrderModel } from "../models/order.model";
import { PaymentModel } from "../models/payment.model";
import { ProductModel } from "../models/product.model";
import { UserModel } from "../models/user.model";

const PAID_STATUSES = [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED];
const TIMEZONE = "America/Edmonton";

export type RevenueRange = "7d" | "30d" | "90d" | "ytd";

function availableStock(variant: {
  stockQuantity?: number;
  reservedQuantity?: number;
}) {
  return Math.max(
    0,
    (variant.stockQuantity ?? 0) - (variant.reservedQuantity ?? 0)
  );
}

/** Start of "today" in America/Edmonton as a UTC Date. */
export function startOfTodayEdmonton(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  // Resolve Edmonton offset by comparing UTC noon with Edmonton clock hour.
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const hourInTz = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      hour12: false,
    }).format(probe)
  );
  const offsetHours = 12 - hourInTz;
  return new Date(Date.UTC(year, month - 1, day, offsetHours, 0, 0, 0));
}

function edmontonDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfRange(range: RevenueRange, now = new Date()) {
  if (range === "ytd") {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
    }).formatToParts(now);
    const year = Number(parts.find((p) => p.type === "year")?.value);
    const probe = new Date(Date.UTC(year, 0, 1, 12, 0, 0));
    const hourInTz = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        hour12: false,
      }).format(probe)
    );
    const offsetHours = 12 - hourInTz;
    return new Date(Date.UTC(year, 0, 1, offsetHours, 0, 0, 0));
  }

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const todayStart = startOfTodayEdmonton(now);
  const start = new Date(todayStart);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

function eachEdmontonDay(from: Date, to: Date) {
  const days: string[] = [];
  const cursor = new Date(from);
  const endKey = edmontonDateKey(to);
  // Safety: avoid infinite loops
  for (let i = 0; i < 400; i += 1) {
    const key = edmontonDateKey(cursor);
    days.push(key);
    if (key === endKey) break;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function startOfMonthEdmonton(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const probe = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  const hourInTz = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      hour12: false,
    }).format(probe)
  );
  const offsetHours = 12 - hourInTz;
  return new Date(Date.UTC(year, month - 1, 1, offsetHours, 0, 0, 0));
}

export async function getDashboardSummary() {
  const todayStart = startOfTodayEdmonton();
  const monthStart = startOfMonthEdmonton();

  const [
    revenueAgg,
    todayRevenueAgg,
    refundAgg,
    orderCount,
    todayOrderCount,
    pendingPaymentCount,
    awaitingFulfillmentCount,
    customerCount,
    customersToday,
    customersThisMonth,
    customersWithOrders,
    productCount,
    publishedProductCount,
    draftProductCount,
    archivedProductCount,
    products,
  ] = await Promise.all([
    OrderModel.aggregate([
      { $match: { paymentStatus: { $in: PAID_STATUSES } } },
      {
        $group: {
          _id: null,
          grossSalesCents: { $sum: "$totals.totalCents" },
          discountCents: { $sum: { $ifNull: ["$discountCents", 0] } },
          taxCents: { $sum: "$totals.taxCents" },
          shippingCents: { $sum: "$totals.shippingCents" },
          count: { $sum: 1 },
        },
      },
    ]),
    OrderModel.aggregate([
      {
        $match: {
          paymentStatus: { $in: PAID_STATUSES },
          $expr: {
            $gte: [{ $ifNull: ["$paidAt", "$createdAt"] }, todayStart],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCents: { $sum: "$totals.totalCents" },
          count: { $sum: 1 },
        },
      },
    ]),
    PaymentModel.aggregate([
      {
        $match: {
          refundedAmountCents: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          refundCents: { $sum: "$refundedAmountCents" },
          count: { $sum: 1 },
        },
      },
    ]),
    OrderModel.countDocuments({}),
    OrderModel.countDocuments({ createdAt: { $gte: todayStart } }),
    OrderModel.countDocuments({ paymentStatus: PaymentStatus.PENDING }),
    OrderModel.countDocuments({
      fulfillmentStatus: FulfillmentStatus.AWAITING_FULFILLMENT,
    }),
    UserModel.countDocuments({
      role: UserRole.CUSTOMER,
      deletedAt: null,
    }),
    UserModel.countDocuments({
      role: UserRole.CUSTOMER,
      deletedAt: null,
      createdAt: { $gte: todayStart },
    }),
    UserModel.countDocuments({
      role: UserRole.CUSTOMER,
      deletedAt: null,
      createdAt: { $gte: monthStart },
    }),
    OrderModel.distinct("userId", {
      userId: { $ne: null },
      paymentStatus: { $in: PAID_STATUSES },
    }).then((ids) => ids.length),
    ProductModel.countDocuments({ deletedAt: null }),
    ProductModel.countDocuments({
      deletedAt: null,
      status: ProductStatus.PUBLISHED,
    }),
    ProductModel.countDocuments({
      deletedAt: null,
      status: ProductStatus.DRAFT,
    }),
    ProductModel.countDocuments({
      deletedAt: null,
      status: ProductStatus.ARCHIVED,
    }),
    ProductModel.find({ deletedAt: null })
      .select("name slug variants lowStockThreshold status")
      .lean(),
  ]);

  let lowStockProducts = 0;
  let outOfStockProducts = 0;

  for (const product of products) {
    const threshold = product.lowStockThreshold ?? 3;
    const variants = product.variants ?? [];
    const available = variants.reduce(
      (sum, variant) => sum + availableStock(variant),
      0
    );
    const anyAvailable = variants.some(
      (variant) =>
        (variant.isAvailable ?? true) && availableStock(variant) > 0
    );
    if (!anyAvailable || available <= 0) {
      outOfStockProducts += 1;
    } else if (available <= threshold) {
      lowStockProducts += 1;
    }
  }

  const revenue = revenueAgg[0] ?? {
    grossSalesCents: 0,
    discountCents: 0,
    taxCents: 0,
    shippingCents: 0,
    count: 0,
  };
  const todayRevenue = todayRevenueAgg[0] ?? { totalCents: 0, count: 0 };
  const refundCents = refundAgg[0]?.refundCents ?? 0;
  const grossSalesCents = revenue.grossSalesCents ?? 0;
  const netSalesCents = Math.max(0, grossSalesCents - refundCents);

  return {
    timezone: TIMEZONE,
    currency: "CAD" as const,
    generatedAt: new Date().toISOString(),
    revenue: {
      label: "Paid order totals (CAD)",
      grossSalesCents,
      discountCents: revenue.discountCents ?? 0,
      taxCents: revenue.taxCents ?? 0,
      shippingCents: revenue.shippingCents ?? 0,
      refundCents,
      netSalesCents,
      paidOrderCount: revenue.count ?? 0,
      refundedOrderCount: refundAgg[0]?.count ?? 0,
    },
    orders: {
      total: orderCount,
      today: todayOrderCount,
      pendingPayment: pendingPaymentCount,
      awaitingFulfillment: awaitingFulfillmentCount,
    },
    today: {
      revenueCents: todayRevenue.totalCents ?? 0,
      paidOrders: todayRevenue.count ?? 0,
    },
    customers: {
      total: customerCount,
      newToday: customersToday,
      newThisMonth: customersThisMonth,
      withCompletedOrders: customersWithOrders,
      returning: Math.max(0, customersWithOrders),
      revenueCents: netSalesCents,
    },
    products: {
      total: productCount,
      published: publishedProductCount,
      draft: draftProductCount,
      archived: archivedProductCount,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
    },
  };
}

export async function getRevenueSeries(range: RevenueRange = "30d") {
  const now = new Date();
  const since = startOfRange(range, now);

  const rows = await OrderModel.aggregate([
    {
      $match: {
        paymentStatus: { $in: PAID_STATUSES },
        $expr: {
          $gte: [{ $ifNull: ["$paidAt", "$createdAt"] }, since],
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: { $ifNull: ["$paidAt", "$createdAt"] },
            timezone: TIMEZONE,
          },
        },
        revenueCents: { $sum: "$totals.totalCents" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byDate = new Map(
    rows.map((row) => [
      row._id as string,
      {
        revenueCents: row.revenueCents as number,
        orders: row.orders as number,
      },
    ])
  );

  return eachEdmontonDay(since, now).map((date) => {
    const point = byDate.get(date);
    return {
      date,
      revenueCents: point?.revenueCents ?? 0,
      orders: point?.orders ?? 0,
    };
  });
}

export async function getOrderStatusBreakdown() {
  const [payment, fulfillment] = await Promise.all([
    OrderModel.aggregate([
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    OrderModel.aggregate([
      { $group: { _id: "$fulfillmentStatus", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    payment: payment.map((row) => ({
      status: row._id as string,
      count: row.count as number,
    })),
    fulfillment: fulfillment.map((row) => ({
      status: row._id as string,
      count: row.count as number,
    })),
  };
}

export async function getBestSellingProducts(limit = 8) {
  const rows = await OrderModel.aggregate([
    { $match: { paymentStatus: { $in: PAID_STATUSES } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.productName" },
        slug: { $first: "$items.productSlug" },
        unitsSold: { $sum: "$items.quantity" },
        revenueCents: { $sum: "$items.lineTotalCents" },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
  ]);

  return rows.map((row) => ({
    productId: row._id ? String(row._id) : null,
    name: row.name as string,
    slug: (row.slug as string) ?? null,
    unitsSold: row.unitsSold as number,
    revenueCents: row.revenueCents as number,
  }));
}

export async function getCategorySales(limit = 8) {
  const rows = await OrderModel.aggregate([
    { $match: { paymentStatus: { $in: PAID_STATUSES } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$product.categoryId",
        unitsSold: { $sum: "$items.quantity" },
        revenueCents: { $sum: "$items.lineTotalCents" },
      },
    },
    { $sort: { revenueCents: -1 } },
    { $limit: limit },
  ]);

  const categoryIds = rows.map((row) => row._id).filter(Boolean);
  const categories = await CategoryModel.find({ _id: { $in: categoryIds } })
    .select("name slug")
    .lean();
  const byId = new Map(
    categories.map((category) => [String(category._id), category])
  );

  return rows.map((row) => {
    const category = row._id ? byId.get(String(row._id)) : null;
    return {
      categoryId: row._id ? String(row._id) : null,
      name: category?.name ?? "Uncategorised",
      slug: category?.slug ?? null,
      unitsSold: row.unitsSold as number,
      revenueCents: row.revenueCents as number,
    };
  });
}
