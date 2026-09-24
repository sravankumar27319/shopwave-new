import type { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  getCurrentUser,
} from "../services/authService.js";
import {
  registerSchema,
  loginSchema,
} from "../validators/authValidator.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  extractRefreshToken,
} from "../utils/tokenUtils.js";
import type { AuthRequest } from "../middleware/index.js";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { safeUser, accessToken, rawRefreshToken } = await registerUser(validatedData);

    setRefreshTokenCookie(res, rawRefreshToken);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      accessToken,
      user: safeUser,
      data: {
        user: safeUser,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { safeUser, accessToken, rawRefreshToken } = await loginUser(validatedData);

    setRefreshTokenCookie(res, rawRefreshToken);

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: safeUser,
      data: {
        user: safeUser,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractRefreshToken(req);
    const { safeUser, accessToken, rawRefreshToken } = await refreshSession(token);

    setRefreshTokenCookie(res, rawRefreshToken);

    res.status(200).json({
      success: true,
      message: "Session refreshed successfully",
      accessToken,
      user: safeUser,
      data: {
        user: safeUser,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractRefreshToken(req);
    await logoutUser(token);
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as unknown as AuthRequest;
    const user = await getCurrentUser(authReq.user.id);

    res.status(200).json({
      success: true,
      user,
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
}
