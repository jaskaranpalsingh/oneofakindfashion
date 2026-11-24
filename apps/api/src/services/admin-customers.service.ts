import { PaymentStatus, UserRole } from "@ookf/shared";
import { Types } from "mongoose";
import { OrderModel } from "../models/order.model";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { createSecureToken, hashToken } from "../utils/crypto-token";
import { env } from "../config/env";
import { sendPasswordResetEmail } from "./auth-email.service";

const PAID = [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED];

export async function listCustomers(options?: {
  q?: string;
  limit?: number;
  page?: number;
  status?: "all" | "active" | "disabled";
}) {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const page = Math.max(options?.page ?? 1, 1);
  const filter: Record<string, unknown> = {
    role: UserRole.CUSTOMER,
    deletedAt: null,
  };

  if (options?.status === "active") filter.isActive = true;
  if (options?.status === "disabled") filter.isActive = false;

  if (options?.q?.trim()) {
    const q = options.q.trim();
    filter.$or = [
      { email: new RegExp(q, "i") },
      { firstName: new RegExp(q, "i") },
      { lastName: new RegExp(q, "i") },
      { phone: new RegExp(q, "i") },
    ];
  }

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .select(
        "firstName lastName email phone isActive createdAt lastLoginAt"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

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

  return {
    items: users.map((user) => {
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
        lastLoginAt: user.lastLoginAt ?? null,
        orderCount: stats.orderCount,
        totalSpendCents: stats.totalSpendCents,
      };
    }),
    meta: {
      page,
      pageSize: limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
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
    .select(
      "firstName lastName email phone isActive createdAt lastLoginAt addresses marketingConsent emailVerified internalNotes deletionRequestedAt stripeCustomerId"
    )
    .lean();

  if (!user) {
    throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  }

  const orders = await OrderModel.find({
    $or: [{ userId: user._id }, { customerEmail: user.email }],
  })
    .sort({ createdAt: -1 })
    .limit(40)
    .select(
      "orderNumber totals paymentStatus fulfillmentStatus createdAt trackingNumber shippingCarrier"
    )
    .lean();

  const spend = orders
    .filter((order) => PAID.includes(order.paymentStatus as never))
    .reduce((sum, order) => sum + (order.totals?.totalCents ?? 0), 0);

  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    isActive: user.isActive ?? true,
    emailVerified: Boolean(user.emailVerified),
    marketingConsent: Boolean(user.marketingConsent),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
    deletionRequestedAt: user.deletionRequestedAt ?? null,
    stripeCustomerId: user.stripeCustomerId ?? null,
    internalNotes: user.internalNotes ?? "",
    addresses: user.addresses ?? [],
    orderCount: orders.length,
    totalSpendCents: spend,
    orders: orders.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      totalCents: order.totals?.totalCents ?? 0,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber ?? null,
      shippingCarrier: order.shippingCarrier ?? null,
    })),
  };
}

export async function updateCustomerAdmin(
  id: string,
  input: {
    isActive?: boolean;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    internalNotes?: string;
  }
) {
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
  if (input.isActive !== undefined) user.isActive = input.isActive;
  if (input.firstName !== undefined) user.firstName = input.firstName;
  if (input.lastName !== undefined) user.lastName = input.lastName;
  if (input.phone !== undefined) user.phone = input.phone ?? undefined;
  if (input.internalNotes !== undefined) {
    user.internalNotes = input.internalNotes;
  }
  await user.save();
  return getCustomerById(id);
}

export async function setCustomerActive(id: string, isActive: boolean) {
  return updateCustomerAdmin(id, { isActive });
}

export async function sendCustomerPasswordReset(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", "Invalid customer id");
  }
  const user = await UserModel.findOne({
    _id: id,
    role: UserRole.CUSTOMER,
    deletedAt: null,
    isActive: true,
  });
  if (!user) {
    throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  }

  const token = createSecureToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await user.save();

  const resetUrl = `${env.WEB_ORIGIN}/account/reset-password?token=${token}`;
  await sendPasswordResetEmail({
    to: user.email,
    firstName: user.firstName,
    resetUrl,
  });
  return { sent: true };
}

/**
 * Fulfill a customer deletion request: deactivate, anonymize PII, clear sessions
 * and wishlist, keep order financial history intact (addresses already snapshotted).
 */
export async function processCustomerDeletion(id: string) {
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

  const originalEmail = user.email;
  const tombstone = `deleted+${String(user._id)}@deleted.local`;

  user.isActive = false;
  user.deletedAt = new Date();
  user.deletionRequestedAt = user.deletionRequestedAt ?? new Date();
  user.firstName = "Deleted";
  user.lastName = "Customer";
  user.email = tombstone;
  user.phone = undefined;
  user.set("addresses", []);
  user.set("wishlistProductIds", []);
  user.marketingConsent = false;
  user.stripeCustomerId = undefined;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.internalNotes = [
    user.internalNotes?.trim(),
    `Account deleted ${new Date().toISOString()}. Original email hash retained in notes for support only: ${originalEmail.replace(
      /(^.).*(@.*$)/,
      "$1***$2"
    )}`,
  ]
    .filter(Boolean)
    .join("\n");
  await user.save();

  // Revoke all express-session documents for this user (connect-mongo store).
  const userId = String(user._id);
  await UserModel.db.collection("sessions").deleteMany({
    $or: [
      { "session.userId": userId },
      { session: { $regex: `"userId":"${userId}"` } },
    ],
  });

  return {
    deleted: true,
    id: String(user._id),
    deletedAt: user.deletedAt,
  };
}
