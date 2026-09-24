import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function getWishlist(userId: string) {
  // Ensure wishlist exists
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { isPrimary: "desc" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: { isPrimary: "desc" } } },
            },
          },
        },
      },
    });
  }

  const items = wishlist.items.map((item) => {
    const primaryImg = item.product.images.find((img) => img.isPrimary) || item.product.images[0];
    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: Number(item.product.price),
        originalPrice: Number(item.product.originalPrice),
        rating: Number(item.product.rating),
        badge: item.product.badge,
        image: primaryImg?.imageUrl || null,
        stock: item.product.stock,
        inStock: item.product.stock > 0,
      },
      addedAt: item.createdAt,
    };
  });

  return { id: wishlist.id, items };
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId } });
  }

  // Check if already in wishlist
  const existing = await prisma.wishlistItem.findFirst({
    where: { wishlistId: wishlist.id, productId },
  });

  if (existing) {
    // Already in wishlist — idempotent success
    return await getWishlist(userId);
  }

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId },
  });

  return await getWishlist(userId);
}

export async function removeFromWishlist(userId: string, itemIdOrProductId: string) {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    throw new AppError("Wishlist not found", 404);
  }

  const item =
    (await prisma.wishlistItem.findUnique({ where: { id: itemIdOrProductId } })) ??
    (await prisma.wishlistItem.findFirst({
      where: { wishlistId: wishlist.id, productId: itemIdOrProductId },
    }));

  if (!item || item.wishlistId !== wishlist.id) {
    throw new AppError("Wishlist item not found", 404);
  }

  await prisma.wishlistItem.delete({ where: { id: item.id } });
}

export async function clearWishlist(userId: string) {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return;
  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
}
