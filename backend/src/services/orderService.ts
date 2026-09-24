import crypto from "crypto";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import emailService from "../email/email.service.js";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export interface CheckoutData {
  addressId: string;
  items?: { productId: string; quantity: number }[] | undefined;
}

const SHIPPING_AMOUNT = 99;
const TAX_RATE = 0.05;

const CANCELABLE_STATUSES = ["PENDING", "CONFIRMED"] as const;

export async function createOrder(userId: string, data: CheckoutData) {
  const address = await prisma.address.findUnique({ where: { id: data.addressId } });
  if (!address || address.userId !== userId) {
    throw new AppError("Invalid delivery address", 400);
  }

  // Pre-resolve requested items if passed
  let resolvedItems: { productId: string; quantity: number }[] = [];
  if (data.items && data.items.length > 0) {
    resolvedItems = data.items.map((i) => ({
      productId: i.productId,
      quantity: Math.max(1, i.quantity),
    }));
  } else {
    const userCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (userCart && userCart.items.length > 0) {
      resolvedItems = userCart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
    }
  }

  if (resolvedItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // Fetch all product records in a single query
  const productIds = resolvedItems.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { id: { in: productIds } },
        { slug: { in: productIds } },
      ],
      isActive: true,
    },
  });

  const productMap = new Map<string, typeof products[0]>();
  for (const p of products) {
    productMap.set(p.id, p);
    productMap.set(p.slug, p);
  }

  const lineItems: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[] = [];

  for (const item of resolvedItems) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      throw new AppError("One or more products in your cart are no longer available", 400);
    }
    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for "${product.name}" (Available: ${product.stock})`, 400);
    }

    const unitPrice = Number(product.price);
    const subtotal = unitPrice * item.quantity;
    lineItems.push({
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: item.quantity,
      subtotal,
    });
  }

  const subtotal = lineItems.reduce((acc, item) => acc + item.subtotal, 0);
  const shippingAmount = SHIPPING_AMOUNT;
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalAmount = subtotal + shippingAmount + taxAmount;

  const order = await prisma.$transaction(
    async (tx) => {
      // 1. Decrement stock for all items
      for (const item of lineItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new AppError("Insufficient stock or concurrent inventory change", 400);
        }
      }

      // 2. Create Order & initial Payment record
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          addressId: data.addressId,
          subtotal,
          shippingAmount,
          taxAmount,
          totalAmount,
          status: "PENDING",
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
          payment: {
            create: {
              provider: "pending",
              amount: totalAmount,
              status: "PENDING",
            },
          },
        },
        include: {
          items: true,
          payment: true,
          address: true,
          user: true,
        },
      });

      // 3. Clean up user's cart in background of transaction
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return newOrder;
    },
    {
      maxWait: 15000,
      timeout: 30000,
    }
  );

  // Send order confirmation email (non-blocking)
  emailService
    .sendOrderConfirmationEmail({
      customerName: order.user.name,
      customerEmail: order.user.email,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
      })),
      subtotal: Number(order.subtotal),
      shippingAmount: Number(order.shippingAmount),
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.totalAmount),
      address: {
        fullName: order.address.fullName,
        addressLine1: order.address.addressLine1,
        addressLine2: order.address.addressLine2 ?? undefined,
        city: order.address.city,
        state: order.address.state,
        postalCode: order.address.postalCode,
        country: order.address.country,
      },
      paymentStatus: order.payment?.status ?? "",
      orderStatus: order.status,
    })
    .catch((err) => {
      logger.error("Failed to send order confirmation email", {
        orderNumber: order.orderNumber,
        error: err.message,
      });
    });
  return formatOrder(order);
}

export async function getOrders(
  userId: string,
  filters: { page?: string | number | undefined; limit?: string | number | undefined } = {}
) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const where = { userId };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payment: true,
        address: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    orders: orders.map(formatOrder),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function getOrderById(userId: string, orderId: string, userRole = "CUSTOMER") {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
      ...(userRole === "ADMIN" ? {} : { userId }),
    },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { isPrimary: "desc" } } },
          },
        },
      },
      payment: true,
      address: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return formatOrderDetail(order as any);
}

export async function cancelOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
      userId,
    },
    include: {
      items: true,
      payment: true,
      user: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === "CANCELLED") {
    throw new AppError("Order is already cancelled", 400);
  }

  if (order.status === "DELIVERED") {
    throw new AppError("Delivered orders cannot be cancelled", 400);
  }

  if (!CANCELABLE_STATUSES.includes(order.status as (typeof CANCELABLE_STATUSES)[number])) {
    throw new AppError(`Order in ${order.status} status cannot be cancelled by customer`, 400);
  }

  const cancelled = await prisma.$transaction(
    async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          userId,
          status: { in: [...CANCELABLE_STATUSES] },
        },
        data: { status: "CANCELLED" },
      });

      if (updated.count !== 1) {
        throw new AppError("This order can no longer be cancelled", 400);
      }

      // If payment was PENDING, update to FAILED
      if (order.payment && order.payment.status === "PENDING") {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "FAILED" },
        });
      }

      // Restore item stock
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          items: true,
          payment: true,
          address: true,
          user: true,
        },
      });
    },
    {
      maxWait: 15000,
      timeout: 30000,
    }
  );

  logger.info("Order cancelled and stock restored", {
    orderId: cancelled.id,
    orderNumber: cancelled.orderNumber,
  });

  // Post-commit cancellation email
  emailService
    .sendOrderCancellationEmail({
      customerName: cancelled.user.name,
      customerEmail: cancelled.user.email,
      orderNumber: cancelled.orderNumber,
      cancellationDate: new Date(),
      totalAmount: Number(cancelled.totalAmount),
    })
    .catch((err) => {
      logger.error("Failed to send order cancellation email", {
        orderNumber: cancelled.orderNumber,
        error: err.message,
      });
    });

  return formatOrder(cancelled);
}

export async function updateOrderStatus(orderId: string, newStatus: string, userRole: string) {
  if (userRole !== "ADMIN") {
    throw new AppError("Only administrators can update order lifecycle status", 403);
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
    },
    include: {
      user: true,
      items: true,
      payment: true,
      address: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === "DELIVERED") {
    throw new AppError("Delivered orders cannot transition to any other status", 400);
  }

  if (order.status === "CANCELLED") {
    throw new AppError("Cancelled orders cannot be modified", 400);
  }

  // Valid status transitions
  const validTransitions: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
  };

  const allowed = validTransitions[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Invalid order status transition from ${order.status} to ${newStatus}`,
      400
    );
  }

  const updatedOrder = await prisma.$transaction(
    async (tx) => {
      if (newStatus === "CANCELLED") {
        // Restore stock if cancelling
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: newStatus as any },
        include: {
          items: true,
          payment: true,
          address: true,
        },
      });
    },
    {
      maxWait: 15000,
      timeout: 30000,
    }
  );

  logger.info("Order status updated by admin", {
    orderId: updatedOrder.id,
    previousStatus: order.status,
    newStatus,
  });

  return formatOrder(updatedOrder);
}

function formatOrder(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    shippingAmount: Number(order.shippingAmount),
    taxAmount: Number(order.taxAmount),
    totalAmount: Number(order.totalAmount),
    itemCount: order.items?.length || 0,
    paymentStatus: order.payment?.status || null,
    address: order.address
      ? {
          fullName: order.address.fullName,
          addressLine1: order.address.addressLine1,
          city: order.address.city,
          state: order.address.state,
          country: order.address.country,
        }
      : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function formatOrderDetail(order: any) {
  const base = formatOrder(order);
  return {
    ...base,
    items: order.items.map((item: any) => {
      const primaryImg = item.product?.images?.find((img: any) => img.isPrimary) || item.product?.images?.[0];
      return {
        id: item.id,
        productName: item.productName,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
        product: item.product
          ? {
              id: item.product.id,
              slug: item.product.slug,
              image: primaryImg?.imageUrl || null,
            }
          : null,
      };
    }),
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          status: order.payment.status,
          amount: Number(order.payment.amount),
        }
      : null,
  };
}
