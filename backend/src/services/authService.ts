import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/tokenUtils.js";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const normalizedEmail = data.email.toLowerCase().trim();

  // 1. Check existing user
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // 3. Create User in transaction with Cart and Wishlist
  const user = await prisma.$transaction(
    async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: "CUSTOMER",
        },
      });

      await tx.cart.create({
        data: { userId: newUser.id },
      });

      await tx.wishlist.create({
        data: { userId: newUser.id },
      });

      return newUser;
    },
    { maxWait: 15000, timeout: 30000 }
  );

  const safeUser = toSafeUser(user);

  // 4. Generate tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const rawRefreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: hashedRefreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { safeUser, accessToken, rawRefreshToken };
}

export async function loginUser(data: { email: string; password: string }) {
  const normalizedEmail = data.email.toLowerCase().trim();

  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // 2. Validate password
  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const safeUser = toSafeUser(user);

  // 3. Generate tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const rawRefreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: hashedRefreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { safeUser, accessToken, rawRefreshToken };
}

export async function refreshSession(rawRefreshToken?: string | null) {
  if (!rawRefreshToken) {
    throw new AppError("Refresh token required", 401);
  }

  const hashedToken = hashToken(rawRefreshToken);

  const existingToken = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!existingToken || existingToken.revoked || existingToken.expiresAt < new Date()) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Revoke old refresh token (token rotation)
  await prisma.refreshToken.update({
    where: { id: existingToken.id },
    data: { revoked: true },
  });

  const user = existingToken.user;
  const safeUser = toSafeUser(user);

  // Issue new tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const newRawRefreshToken = generateRefreshToken();
  const newHashedToken = hashToken(newRawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: newHashedToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { safeUser, accessToken, rawRefreshToken: newRawRefreshToken };
}

export async function logoutUser(rawRefreshToken?: string | null) {
  if (rawRefreshToken) {
    const hashed = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { token: hashed },
      data: { revoked: true },
    });
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return toSafeUser(user);
}
