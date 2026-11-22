import argon2 from "argon2";
import { AdminRole, UserRole, loginSchema, registerSchema } from "@ookf/shared";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";

export async function registerCustomer(input: unknown) {
  const data = registerSchema.parse(input);
  const existing = await UserModel.exists({
    email: data.email.toLowerCase(),
  });
  if (existing) {
    throw new AppError(409, "EMAIL_EXISTS", "An account with this email already exists");
  }

  const passwordHash = await argon2.hash(data.password, {
    type: argon2.argon2id,
  });

  const user = await UserModel.create({
    email: data.email.toLowerCase(),
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    role: UserRole.CUSTOMER,
  });

  return toAuthUser(user);
}

export async function authenticateUser(input: unknown) {
  const data = loginSchema.parse(input);
  const user = await UserModel.findOne({ email: data.email.toLowerCase() }).select(
    "+passwordHash"
  );

  if (!user || !user.isActive || user.deletedAt) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const valid = await argon2.verify(user.passwordHash, data.password);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  return toAuthUser(user);
}

export async function getUserById(id: string) {
  const user = await UserModel.findById(id);
  if (!user || !user.isActive || user.deletedAt) {
    return null;
  }
  return toAuthUser(user);
}

export async function createInitialAdmin(email: string, password: string) {
  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role !== UserRole.ADMIN) {
      existing.role = UserRole.ADMIN;
      existing.adminRole = AdminRole.OWNER;
      await existing.save();
    }
    return toAuthUser(existing);
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await UserModel.create({
    email: email.toLowerCase(),
    passwordHash,
    firstName: "Store",
    lastName: "Owner",
    role: UserRole.ADMIN,
    adminRole: AdminRole.OWNER,
  });

  return toAuthUser(user);
}

function toAuthUser(user: {
  id?: string;
  _id?: { toString(): string };
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  adminRole?: string | null;
}) {
  return {
    id: user.id ?? String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as "customer" | "admin",
    adminRole: (user.adminRole as "owner" | "manager" | "staff" | undefined) ?? undefined,
  };
}
