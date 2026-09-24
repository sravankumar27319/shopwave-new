import prisma, { Prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

function formatReview(review: {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string };
}) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: {
      id: review.user.id,
      name: review.user.name,
    },
  };
}

async function refreshProductRating(productId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const aggregates = await tx.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const average = aggregates._avg.rating ?? 0;
  const rounded = Math.round(average * 10) / 10;

  await tx.product.update({
    where: { id: productId },
    data: {
      rating: rounded,
      reviewCount: aggregates._count._all,
    },
  });
}

export async function getProductReviews(productId: string) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }] },
  });
  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map(formatReview);
}

export async function createReview(
  userId: string,
  productId: string,
  data: { rating: number; comment?: string | null | undefined }
) {

  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }] },
  });
  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  try {
    const review = await prisma.$transaction(
      async (tx) => {
        const created = await tx.review.create({
          data: {
            userId,
            productId: product.id,
            rating: data.rating,
            comment: data.comment ?? null,
          },
          include: {
            user: { select: { id: true, name: true } },
          },
        });
        await refreshProductRating(product.id, tx);
        return created;
      },
      { maxWait: 15000, timeout: 30000 }
    );
    return formatReview(review);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError("You have already reviewed this product", 409);
    }
    throw err;
  }
}

export async function updateReview(
  userId: string,
  reviewId: string,
  data: { rating?: number | undefined; comment?: string | null | undefined }
) {

  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    throw new AppError("Review not found", 404);
  }
  if (existing.userId !== userId) {
    throw new AppError("You can only modify your own review", 403);
  }

  const review = await prisma.$transaction(
    async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          ...(data.rating !== undefined ? { rating: data.rating } : {}),
          ...(data.comment !== undefined ? { comment: data.comment } : {}),
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
      await refreshProductRating(existing.productId, tx);
      return updated;
    },
    { maxWait: 15000, timeout: 30000 }
  );

  return formatReview(review);
}

export async function deleteReview(userId: string, reviewId: string) {
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    throw new AppError("Review not found", 404);
  }
  if (existing.userId !== userId) {
    throw new AppError("You can only delete your own review", 403);
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await refreshProductRating(existing.productId, tx);
    },
    { maxWait: 15000, timeout: 30000 }
  );
}
