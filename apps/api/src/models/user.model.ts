import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { AdminRole, UserRole } from "@ookf/shared";

const addressSchema = new Schema(
  {
    label: String,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: String,
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "Canada" },
    phone: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      index: true,
    },
    adminRole: {
      type: String,
      enum: Object.values(AdminRole),
    },
    addresses: [addressSchema],
    wishlistProductIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: Date,
    lastLoginAt: Date,
    deletedAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const UserModel = model("User", userSchema);
