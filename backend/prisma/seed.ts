import prisma from "../src/config/prisma.js";
import { Prisma } from "../src/config/prisma.js";

const categories = [
  { id: "cat-women", name: "Women", slug: "women", description: "Elegantly tailored styles for women" },
  { id: "cat-men", name: "Men", slug: "men", description: "Modern essentials for men" },
  { id: "cat-kids", name: "Kids", slug: "kids", description: "Playful, durable clothing for kids" },
  { id: "cat-accessories", name: "Accessories", slug: "accessories", description: "Bags, jewelry, and complementary accents" },
  { id: "cat-footwear", name: "Footwear", slug: "footwear", description: "Premium shoes and sneakers" },
];

const products = [
  {
    name: "Silk Drape Midi Dress",
    categorySlug: "women",
    price: 4299,
    originalPrice: 6499,
    rating: 4.7,
    reviewCount: 214,
    badge: "Bestseller",
    colors: ["#c9a882", "#2d3748", "#744210"],
    sizes: ["XS", "S", "M", "L", "XL"],
    primaryImage: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=700&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700&q=80",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&q=80",
    ],
    description: "Effortlessly elegant silk-blend midi dress with a relaxed drape silhouette. Features a subtle wrap front, adjustable tie waist, and delicate flutter sleeves. Perfect for evenings out or elevated daywear.",
    features: ["100% Silk blend", "Dry clean only", "Relaxed fit", "Mid-calf length"],
    stock: 45,
    sku: "SKU-W-001",
  },
  {
    name: "Linen Blazer – Oat",
    categorySlug: "women",
    price: 3799,
    originalPrice: 5200,
    rating: 4.5,
    reviewCount: 98,
    badge: "New",
    colors: ["#d4c5a9", "#1a202c", "#c05621"],
    sizes: ["XS", "S", "M", "L"],
    primaryImage: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4687?w=700&q=80",
    ],
    description: "Structured yet breathable linen blazer in a warm oat tone. Notched lapels, two flap pockets, and a single-button closure make this an easy-reach wardrobe cornerstone.",
    features: ["Pure linen", "Structured shoulder", "Single button", "Machine washable"],
    stock: 30,
    sku: "SKU-W-002",
  },
  {
    name: "Slim Chino Trousers",
    categorySlug: "men",
    price: 2199,
    originalPrice: 3299,
    rating: 4.4,
    reviewCount: 312,
    badge: null,
    colors: ["#a0856c", "#2d3748", "#f5f5f4"],
    sizes: ["28", "30", "32", "34", "36"],
    primaryImage: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=700&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=700&q=80",
    ],
    description: "Clean-cut slim chinos crafted in a stretch-cotton blend. Sits at the natural waist with a tapered leg for a sharp, contemporary profile.",
    features: ["98% Cotton, 2% Elastane", "Slim fit", "Zip fly", "Two side pockets"],
    stock: 60,
    sku: "SKU-M-001",
  },
  {
    name: "Oxford Button-Down",
    categorySlug: "men",
    price: 1899,
    originalPrice: 2600,
    rating: 4.6,
    reviewCount: 487,
    badge: "Bestseller",
    colors: ["#f5f5f4", "#93c5fd", "#fca5a5"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    primaryImage: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&q=80",
      "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=700&q=80",
    ],
    description: "The quintessential Oxford shirt in a tightly woven cotton that softens with every wash. Works equally well tucked into trousers or worn open over a tee.",
    features: ["100% Cotton Oxford", "Regular fit", "Button-down collar", "Machine washable"],
    stock: 75,
    sku: "SKU-M-002",
  },
  {
    name: "Mini Crossbody Bag",
    categorySlug: "accessories",
    price: 2599,
    originalPrice: 3800,
    rating: 4.8,
    reviewCount: 156,
    badge: "Hot",
    colors: ["#a16207", "#1c1917", "#be185d"],
    sizes: ["One Size"],
    primaryImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=700&q=80",
    ],
    description: "Compact structured crossbody in full-grain leather with an adjustable chain-leather strap. Fits your essentials with room to spare.",
    features: ["Full-grain leather", "Gold hardware", "Adjustable strap", "Interior zip pocket"],
    stock: 25,
    sku: "SKU-A-001",
  },
  {
    name: "Leather Derby Shoes",
    categorySlug: "footwear",
    price: 5499,
    originalPrice: 7200,
    rating: 4.9,
    reviewCount: 73,
    badge: "Premium",
    colors: ["#1c1917", "#7c3f13"],
    sizes: ["6", "7", "8", "9", "10", "11"],
    primaryImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80",
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=700&q=80",
    ],
    description: "Hand-burnished calfskin derby with a Blake-stitched sole. The rounded toe and minimal brogue detailing strike a balance between formal rigour and everyday wearability.",
    features: ["Calfskin upper", "Leather sole", "Blake stitch", "Hand-finished"],
    stock: 20,
    sku: "SKU-F-001",
  },
  {
    name: "Kids Striped Tee",
    categorySlug: "kids",
    price: 699,
    originalPrice: 999,
    rating: 4.3,
    reviewCount: 241,
    badge: null,
    colors: ["#bfdbfe", "#fde68a", "#bbf7d0"],
    sizes: ["2Y", "4Y", "6Y", "8Y", "10Y"],
    primaryImage: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=700&q=80",
    ],
    description: "Soft organic cotton tee in a classic Breton stripe. Pre-washed for instant softness. Easy pull-on with ribbed crew neck.",
    features: ["100% Organic Cotton", "Pre-washed", "Crew neck", "Machine washable"],
    stock: 80,
    sku: "SKU-K-001",
  },
  {
    name: "Cashmere Crew Neck",
    categorySlug: "women",
    price: 6999,
    originalPrice: 9500,
    rating: 4.8,
    reviewCount: 89,
    badge: "Luxury",
    colors: ["#fde68a", "#e2e8f0", "#fca5a5"],
    sizes: ["XS", "S", "M", "L"],
    primaryImage: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700&q=80",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=700&q=80",
    ],
    description: "Pure Grade-A Mongolian cashmere in a relaxed crew neck silhouette. Incredibly soft with a natural sheen that deepens with wear.",
    features: ["100% Mongolian Cashmere", "Grade A", "Relaxed fit", "Dry clean recommended"],
    stock: 15,
    sku: "SKU-W-003",
  },
  {
    name: "Canvas Tote Bag",
    categorySlug: "accessories",
    price: 999,
    originalPrice: 1499,
    rating: 4.2,
    reviewCount: 334,
    badge: null,
    colors: ["#d6d3d1", "#1c1917", "#4ade80"],
    sizes: ["One Size"],
    primaryImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80",
    ],
    description: "Heavy-duty 16oz canvas tote with reinforced handles and a zipped inner pocket. Carries a week's groceries or a weekend's worth of reading.",
    features: ["16oz Canvas", "Reinforced handles", "Inner zip pocket", "Vegan"],
    stock: 90,
    sku: "SKU-A-002",
  },
  {
    name: "Wool Overcoat",
    categorySlug: "men",
    price: 8999,
    originalPrice: 12000,
    rating: 4.9,
    reviewCount: 52,
    badge: "Premium",
    colors: ["#44403c", "#1c1917", "#d4c5a9"],
    sizes: ["S", "M", "L", "XL"],
    primaryImage: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=700&q=80",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&q=80",
    ],
    description: "Double-faced Italian wool overcoat with peak lapels and a belted back. Cut generously to layer over suits, it reads sharp without trying.",
    features: ["Italian Wool", "Double-faced", "Peak lapels", "Dry clean"],
    stock: 20,
    sku: "SKU-M-003",
  },
  {
    name: "White Sneakers",
    categorySlug: "footwear",
    price: 3299,
    originalPrice: 4500,
    rating: 4.6,
    reviewCount: 623,
    badge: "Bestseller",
    colors: ["#f5f5f4", "#1c1917"],
    sizes: ["6", "7", "8", "9", "10", "11"],
    primaryImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=700&q=80",
      "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=700&q=80",
    ],
    description: "Minimalist low-top sneaker in full-grain leather with a cupsole construction. The clean profile pairs with everything from denim to tailoring.",
    features: ["Full-grain leather", "Rubber cupsole", "OrthoLite insole", "Unisex"],
    stock: 55,
    sku: "SKU-F-002",
  },
  {
    name: "Kids Denim Dungarees",
    categorySlug: "kids",
    price: 1299,
    originalPrice: 1899,
    rating: 4.4,
    reviewCount: 178,
    badge: "New",
    colors: ["#bfdbfe", "#7c3f13"],
    sizes: ["2Y", "4Y", "6Y", "8Y"],
    primaryImage: "https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?w=700&q=80",
    ],
    description: "Classic bib dungarees in soft organic denim. Adjustable straps, button-tab bib, and roomy pockets make these the go-to for active days.",
    features: ["Organic denim", "Adjustable straps", "Roomy pockets", "Machine washable"],
    stock: 40,
    sku: "SKU-K-002",
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Seeding categories...");
  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, description: cat.description },
    });
    categoryMap.set(cat.slug, upserted.id);
  }

  console.log("Seeding products...");
  for (const p of products) {
    const categoryId = categoryMap.get(p.categorySlug);
    if (!categoryId) continue;

    const slug = slugify(p.name);
    const existing = await prisma.product.findUnique({
      where: { slug },
      include: { images: true },
    });

    if (existing) {
      console.log(`Product "${p.name}" already exists. Skipping.`);
      continue;
    }

    const created = await prisma.product.create({
      data: {
        categoryId,
        name: p.name,
        slug,
        description: p.description,
        price: new Prisma.Decimal(p.price),
        originalPrice: new Prisma.Decimal(p.originalPrice),
        rating: new Prisma.Decimal(p.rating),
        reviewCount: p.reviewCount,
        badge: p.badge,
        colors: p.colors,
        sizes: p.sizes,
        features: p.features,
        stock: p.stock,
        sku: p.sku,
        isActive: true,
        images: {
          create: [
            { imageUrl: p.primaryImage, isPrimary: true },
            ...p.images.map((img) => ({ imageUrl: img, isPrimary: false })),
          ],
        },
      },
    });

    console.log(`Created product: ${created.name} (${created.id})`);
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
