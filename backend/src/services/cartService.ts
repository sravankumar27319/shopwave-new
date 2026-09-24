import prisma, { Prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
};

const toNumber = (dec: Prisma.Decimal) => Number(dec.toString());

export const getCartDetails = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: { include: { images: true } } },
  });

  const formattedItems = items.map((item) => {
    const primaryImage = item.product.images.find((img) => img.isPrimary);
    const unitPrice = toNumber(item.product.price);
    const subtotal = unitPrice * item.quantity;
    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: unitPrice,
        image: primaryImage?.imageUrl || null,
      },
      quantity: item.quantity,
      subtotal,
    };
  });

  const cartSubtotal = formattedItems.reduce((acc, i) => acc + i.subtotal, 0);
  const itemCount = formattedItems.reduce((acc, i) => acc + i.quantity, 0);

  return {
    id: cart.id,
    items: formattedItems,
    subtotal: cartSubtotal,
    itemCount,
  };
};

export const addItemToCart = async (userId: string, productId: string, quantity: number) => {
  if (quantity <= 0) {
    throw new AppError("Quantity must be greater than zero", 400);
  }
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  if (!product.isActive) {
    throw new AppError("Product is not active", 400);
  }
  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }
  const cart = await getOrCreateCart(userId);
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (product.stock < newQty) {
      throw new AppError("Insufficient stock for updated quantity", 400);
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }
  return await getCartDetails(userId);
};

export const updateCartItemQuantity = async (userId: string, itemId: string, quantity: number) => {
  if (quantity <= 0) {
    throw new AppError("Quantity must be greater than zero", 400);
  }
  const cart = await getOrCreateCart(userId);
  const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!cartItem || cartItem.cartId !== cart.id) {
    throw new AppError("Cart item not found", 404);
  }
  const product = await prisma.product.findUnique({ where: { id: cartItem.productId } });
  if (!product) {
    throw new AppError("Associated product not found", 404);
  }
  if (!product.isActive) {
    throw new AppError("Product is not active", 400);
  }
  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return await getCartDetails(userId);
};

export const deleteCartItemById = async (userId: string, itemId: string) => {
  const cart = await getOrCreateCart(userId);
  const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!cartItem || cartItem.cartId !== cart.id) {
    throw new AppError("Cart item not found", 404);
  }
  await prisma.cartItem.delete({ where: { id: itemId } });
};

export const clearUserCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
};
