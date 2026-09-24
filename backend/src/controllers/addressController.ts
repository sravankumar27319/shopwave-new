import type { Request, Response, NextFunction } from "express";
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../services/addressService.js";
import { createAddressSchema, updateAddressSchema } from "../validators/addressValidator.js";
import type { AuthRequest } from "../middleware/index.js";
import { AppError } from "../utils/AppError.js";

export async function listAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const addresses = await getAddresses(userId);
    res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
}

export async function getSingleAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const addressId = (req.params["id"] as string) || "";
    if (!addressId) throw new AppError("Address ID is required", 400);
    const address = await getAddressById(userId, addressId);
    res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

export async function createAddressHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const validatedData = createAddressSchema.parse(req.body);
    const address = await createAddress(userId, validatedData);
    res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

export async function updateAddressHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const addressId = (req.params["id"] as string) || "";
    if (!addressId) throw new AppError("Address ID is required", 400);
    const validatedData = updateAddressSchema.parse(req.body);
    const address = await updateAddress(userId, addressId, validatedData);
    res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddressHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const addressId = (req.params["id"] as string) || "";
    if (!addressId) throw new AppError("Address ID is required", 400);
    await deleteAddress(userId, addressId);
    res.status(200).json({ success: true, message: "Address deleted" });
  } catch (err) {
    next(err);
  }
}

export async function setDefaultAddressHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const addressId = (req.params["id"] as string) || "";
    if (!addressId) throw new AppError("Address ID is required", 400);
    const address = await setDefaultAddress(userId, addressId);
    res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}
