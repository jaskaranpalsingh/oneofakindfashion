import argon2 from "argon2";
import {
  AdminRole,
  UserRole,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from "@ookf/shared";
import { env } from "../config/env";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { createSecureToken, hashToken } from "../utils/crypto-token";
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "./auth-email.service";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "customer" | "admin";
  adminRole?: "owner" | "manager" | "staff";
  emailVerified: boolean;
  marketingConsent: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
};

function toAuthUser(user: {
  id?: string;
  _id?: { toString(): string };
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  adminRole?: string | null;
  emailVerified?: boolean | null;
  marketingConsent?: boolean | null;
  lastLoginAt?: Date | null;
  createdAt?: Date | null;
}): AuthUser {
  return {
    id: user.id ?? String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? null,
    role: user.role as "customer" | "admin",
    adminRole:
      (user.adminRole as "owner" | "manager" | "staff" | undefined) ?? undefined,
    emailVerified: Boolean(user.emailVerified),
    marketingConsent: Boolean(user.marketingConsent),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
  };
}

async function issueEmailVerification(userId: string, email: string, firstName: string) {
  const token = createSecureToken();
  await UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    }
  );
  const verifyUrl = `${env.WEB_ORIGIN}/account/verify-email?token=${token}`;
  await sendEmailVerificationEmail({ to: email, firstName, verifyUrl });
  return token;
}

export async function registerCustomer(input: unknown) {
  const data = registerSchema.parse(input);
  if (data.acceptTerms === false) {
    throw new AppError(400, "TERMS_REQUIRED", "You must accept the terms and conditions");
  }

  const existing = await UserModel.exists({
    email: data.email.toLowerCase(),
    deletedAt: null,
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
    marketingConsent: Boolean(data.marketingConsent),
    termsAcceptedAt: new Date(),
    emailVerified: false,
  });

  await issueEmailVerification(String(user._id), user.email, user.firstName);

  return toAuthUser(user);
}

export async function authenticateUser(input: unknown) {
  const data = loginSchema.parse(input);
  const user = await UserModel.findOne({
    email: data.email.toLowerCase(),
    deletedAt: null,
  }).select("+passwordHash");

  if (!user || !user.isActive) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const valid = await argon2.verify(user.passwordHash, data.password);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: toAuthUser(user),
    rememberMe: Boolean(data.rememberMe),
  };
}

export async function getUserById(id: string) {
  const user = await UserModel.findOne({ _id: id, deletedAt: null });
  if (!user || !user.isActive) {
    return null;
  }
  return toAuthUser(user);
}

export async function updateProfile(userId: string, input: unknown) {
  const data = updateProfileSchema.parse(input);
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "Account not found");
  }

  if (data.firstName !== undefined) user.firstName = data.firstName;
  if (data.lastName !== undefined) user.lastName = data.lastName;
  if (data.phone !== undefined) user.phone = data.phone ?? undefined;
  if (data.marketingConsent !== undefined) {
    user.marketingConsent = data.marketingConsent;
  }
  await user.save();
  return toAuthUser(user);
}

export async function changePassword(userId: string, input: unknown) {
  const data = changePasswordSchema.parse(input);
  const user = await UserModel.findOne({ _id: userId, deletedAt: null }).select(
    "+passwordHash"
  );
  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "Account not found");
  }

  const valid = await argon2.verify(user.passwordHash, data.currentPassword);
  if (!valid) {
    throw new AppError(400, "INVALID_PASSWORD", "Current password is incorrect");
  }

  user.passwordHash = await argon2.hash(data.newPassword, {
    type: argon2.argon2id,
  });
  await user.save();
  return { updated: true };
}

export async function requestPasswordReset(input: unknown) {
  const data = forgotPasswordSchema.parse(input);
  const user = await UserModel.findOne({
    email: data.email.toLowerCase(),
    deletedAt: null,
    isActive: true,
  });

  // Always succeed to avoid email enumeration.
  if (!user) {
    return { sent: true };
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

export async function resetPassword(input: unknown) {
  const data = resetPasswordSchema.parse(input);
  const tokenHash = hashToken(data.token);
  const user = await UserModel.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
    deletedAt: null,
  }).select("+passwordHash +passwordResetTokenHash");

  if (!user) {
    throw new AppError(400, "INVALID_TOKEN", "Reset link is invalid or expired");
  }

  user.passwordHash = await argon2.hash(data.password, {
    type: argon2.argon2id,
  });
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
  return { reset: true };
}

export async function verifyEmail(input: unknown) {
  const data = verifyEmailSchema.parse(input);
  const tokenHash = hashToken(data.token);
  const user = await UserModel.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() },
    deletedAt: null,
  }).select("+emailVerificationTokenHash");

  if (!user) {
    throw new AppError(
      400,
      "INVALID_TOKEN",
      "Verification link is invalid or expired"
    );
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  return toAuthUser(user);
}

export async function resendVerificationEmail(userId: string) {
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "Account not found");
  }
  if (user.emailVerified) {
    return { sent: false, alreadyVerified: true };
  }
  await issueEmailVerification(String(user._id), user.email, user.firstName);
  return { sent: true, alreadyVerified: false };
}

export async function requestAccountDeletion(userId: string) {
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "Account not found");
  }
  user.deletionRequestedAt = new Date();
  await user.save();
  return { requested: true };
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
    emailVerified: true,
  });

  return toAuthUser(user);
}
