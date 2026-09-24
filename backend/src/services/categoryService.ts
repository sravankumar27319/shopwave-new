import prisma from "../config/prisma.js";

export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    productCount: cat._count.products,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  }));
}
