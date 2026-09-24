import prisma, { Prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function getAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function getAddressById(userId: string, addressId: string) {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new AppError("Address not found", 404);
  }
  return address;
}

export async function createAddress(
  userId: string,
  data: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null | undefined;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault?: boolean | undefined;
  }
) {

  const existingCount = await prisma.address.count({ where: { userId } });
  const isDefault = data.isDefault ?? existingCount === 0;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.address.create({
    data: {
      userId,
      fullName: data.fullName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      isDefault,
    },
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  data: {
    fullName?: string | undefined;
    phone?: string | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | null | undefined;
    city?: string | undefined;
    state?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
    isDefault?: boolean | undefined;
  }
) {

  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) {
    throw new AppError("Address not found", 404);
  }

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updateData: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      updateData[k] = v;
    }
  }

  return prisma.address.update({
    where: { id: addressId },
    data: updateData,
  });
}


export async function deleteAddress(userId: string, addressId: string) {
  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) {
    throw new AppError("Address not found", 404);
  }
  try {
    await prisma.address.delete({ where: { id: addressId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      throw new AppError("This address is used by an existing order and cannot be deleted", 409);
    }
    throw err;
  }
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) {
    throw new AppError("Address not found", 404);
  }

  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  return prisma.address.update({
    where: { id: addressId },
    data: { isDefault: true },
  });
}
