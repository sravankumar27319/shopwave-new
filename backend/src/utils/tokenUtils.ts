import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import type { Response, Request } from "express";

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Generate short-lived JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.accessTokenExpiresIn as any,
  });
}

/**
 * Generate random cryptographically strong refresh token string
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

/**
 * Hash refresh token with SHA-256 for secure DB storage
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Set HttpOnly refresh token cookie on response
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: config.nodeEnv === "production" ? "strict" : "lax",
    maxAge: config.refreshCookieMaxAge,
    path: "/",
  });
}

/**
 * Clear refresh token cookie from response
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: config.nodeEnv === "production" ? "strict" : "lax",
    path: "/",
  });
}

/**
 * Extract refresh token from cookies header or request body
 */
export function extractRefreshToken(req: Request): string | null {
  // Check cookie header
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, pair) => {
      const [key, val] = pair.trim().split("=");
      if (key && val) {
        acc[key] = decodeURIComponent(val);
      }
      return acc;
    }, {} as Record<string, string>);

    if (cookies["refreshToken"]) {
      return cookies["refreshToken"];
    }
  }

  // Fallback to request body
  if (req.body && typeof req.body["refreshToken"] === "string") {
    return req.body["refreshToken"];
  }

  return null;
}
