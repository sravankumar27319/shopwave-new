import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { AppError } from "../utils/AppError.js";

// Extend Express Request to carry authenticated user info
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}

// ------------------------------------------------------------------
// Authentication middleware – verifies JWT access token from header
// ------------------------------------------------------------------
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  try {
    const payload = jwt.verify(token, config.jwtAccessSecret) as jwt.JwtPayload;
    (req as any).user = {
      id: payload["sub"] as string,
      email: payload["email"] as string,
      role: payload["role"] as string,
    };
    next();
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }
}

// ------------------------------------------------------------------
// Role-based authorization middleware
// ------------------------------------------------------------------
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) {
      throw new AppError("Authentication required", 401);
    }
    if (!roles.includes(user.role)) {
      throw new AppError("Insufficient permissions", 403);
    }
    next();
  };
}

// ------------------------------------------------------------------
// 404 handler
// ------------------------------------------------------------------
export function notFoundHandler(req: Request, _res: Response): void {
  throw new AppError(`Not Found - ${req.originalUrl}`, 404);
}

// ------------------------------------------------------------------
// Central error handler
// ------------------------------------------------------------------
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: (err as any).issues?.map((i: any) => i.message) ?? [],
    });
    return;
  }

  // Log unexpected errors
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: config.nodeEnv === "production"
      ? "An internal server error occurred"
      : err.message,
  });
}
