import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export interface ProductFilters {
  page?: string | number | undefined;
  limit?: string | number | undefined;
  category?: string | undefined;
  search?: string | undefined;
  sortBy?: "newest" | "price_asc" | "price_desc" | "rating" | undefined;
}


export function formatProduct(p: any) {
  const primaryImg = p.images?.find((img: any) => img.isPrimary) || p.images?.[0];
  const allImageUrls = p.images?.map((img: any) => img.imageUrl) || [];

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: Number(p.price),
    originalPrice: Number(p.originalPrice),
    rating: Number(p.rating),
    reviewCount: p.reviewCount,
    badge: p.badge,
    colors: p.colors || [],
    sizes: p.sizes || [],
    features: p.features || [],
    stock: p.stock,
    inStock: p.stock > 0,
    sku: p.sku,
    isActive: p.isActive,
    image: primaryImg?.imageUrl || null,
    images: allImageUrls,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
        }
      : null,
    reviews: p.reviews?.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: r.user ? { id: r.user.id, name: r.user.name } : null,
    })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function getProducts(filters: ProductFilters) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  // Category filter
  if (filters.category && filters.category !== "all") {
    where.OR = [
      { categoryId: filters.category },
      { category: { slug: filters.category.toLowerCase() } },
    ];
  }

  // Search filter
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim();
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
    ];
  }

  // Sorting
  let orderBy: any = { createdAt: "desc" };
  switch (filters.sortBy) {
    case "price_asc":
      orderBy = { price: "asc" };
      break;
    case "price_desc":
      orderBy = { price: "desc" };
      break;
    case "rating":
      orderBy = { rating: "desc" };
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const [total, rawProducts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: {
          orderBy: { isPrimary: "desc" },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  const products = rawProducts.map(formatProduct);
  const totalPages = Math.ceil(total / limit);

  return {
    products,
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

export async function getProductById(idOrSlug: string) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      category: true,
      images: {
        orderBy: { isPrimary: "desc" },
      },
      reviews: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  return formatProduct(product);
}
