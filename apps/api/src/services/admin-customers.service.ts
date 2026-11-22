import { PaymentStatus, UserRole } from "@ookf/shared";
import { Types } from "mongoose";
import { OrderModel } from "../models/order.model";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";

const PAID = [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED];

export async function listCustomers(options?: { q?: string; limit?: number }) {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const filter: Record<string, unknown> = {
    role: UserRole.CUSTOMER,
    deletedAt: null,
  };

  if (options?.q?.trim()) {
    const q = options.q.trim();
    filter.$or = [
      { email: new RegExp(q, "i") },
      { firstName: new RegExp(q, "i") },
      { lastName: new RegExp(q, "i") },
    ];
  }

  const users = await UserModel.find(filter)
    .select("firstName lastName email phone isActive createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const emails = users.map((user) => user.email);
  const spend = await OrderModel.aggregate([
    {
      $match: {
        customerEmail: { $in: emails },
        paymentStatus: { $in: PAID },
      },
    },
    {
      $group: {
        _id: "$customerEmail",
        orderCount: { $sum: 1 },
        totalSpendCents: { $sum: "$totals.totalCents" },
      },
    },
  ]);
  const spendByEmail = new Map(
    spend.map((row) => [
      String(row._id).toLowerCase(),
      {
        orderCount: row.orderCount as number,
        totalSpendCents: row.totalSpendCents as number,
      },
    ])
  );

  return users.map((user) => {
    const stats = spendByEmail.get(user.email.toLowerCase()) ?? {
      orderCount: 0,
      totalSpendCents: 0,
    };
    return {
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? null,
      isActive: user.isActive ?? true,
      createdAt: user.createdAt,
      orderCount: stats.orderCount,
      totalSpendCents: stats.totalSpendCents,
    };
  });
}

export async function getCustomerById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", "Invalid customer id");
  }

  const user = await UserModel.findOne({
    _id: id,
    role: UserRole.CUSTOMER,
    deletedAt: null,
  })
    .select("firstName lastName email phone isActive createdAt addresses")
    .lean();

  if (!user) {
    throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  }

  const orders = await OrderModel.find({ customerEmail: user.email })
    .sort({ createdAt: -1 })
    .limit(20)
    .select(
      "orderNumber totals paymentStatus fulfillmentStatus createdAt"
    )
    .lean();

  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
    addresses: user.addresses ?? [],
    orders: orders.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      totalCents: order.totals?.totalCents ?? 0,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      createdAt: order.createdAt,
    })),
  };
}

export async function setCustomerActive(id: string, isActive: boolean) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", "Invalid customer id");
  }
  const user = await UserModel.findOne({
    _id: id,
    role: UserRole.CUSTOMER,
    deletedAt: null,
  });
  if (!user) {
    throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  }
  user.isActive = isActive;
  await user.save();
  return getCustomerById(id);
}
