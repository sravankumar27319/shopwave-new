import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Truck, RefreshCw, Shield, Headphones } from "lucide-react";
import ProductCard from "../components/products/ProductCard";
import { ProductCardSkeleton } from "../components/ui/Skeletons";
import * as shopApi from "../api/shopApi";

const defaultBanners = [
  {
    id: 1,
    title: "New Arrivals",
    subtitle: "Summer 2025 Collection",
    cta: "Shop Now",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80",
    category: "women",
  },
  {
    id: 2,
    title: "Men's Edit",
    subtitle: "Refined essentials for every occasion",
    cta: "Explore",
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1400&q=80",
    category: "men",
  },
  {
    id: 3,
    title: "Kids' World",
    subtitle: "Playful, durable, adorable",
    cta: "Shop Kids",
    image: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=1400&q=80",
    category: "kids",
  },
];

function HeroBanner() {
  const [active, setActive] = useState(0);
  const banners = defaultBanners;

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const banner = banners[active];

  return (
    <div className="relative h-[80vh] overflow-hidden bg-stone-900">
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={b.image}
            alt={b.title}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-linear-to-r from-stone-900/70 via-stone-900/30 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="max-w-lg">
            <p className="text-amber-400 text-sm tracking-widest uppercase font-body mb-3">
              {banner.subtitle}
            </p>
            <h1 className="font-display text-5xl sm:text-7xl text-white leading-tight mb-6">
              {banner.title}
            </h1>
            <Link
              to={`/products?category=${banner.category}`}
              className="inline-flex items-center gap-2 bg-white text-stone-900 px-7 py-3.5 text-sm font-semibold tracking-wide hover:bg-amber-600 hover:text-white transition-colors"
            >
              {banner.cta}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`transition-all duration-300 rounded-full ${
              i === active ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/40"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <button
        onClick={() => setActive((a) => (a - 1 + banners.length) % banners.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 p-2 rounded-full text-white transition-colors"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={() => setActive((a) => (a + 1) % banners.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 p-2 rounded-full text-white transition-colors"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

function CategoryStrip() {
  const [categories, setCategories] = useState([]);

  const catImages = {
    women: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=70",
    men: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&q=70",
    kids: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&q=70",
    accessories: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=70",
    footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=70",
  };

  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await shopApi.getCategories();
        if (res?.data) {
          // Filter out categories without items or test items if desired
          setCategories(res.data.filter((c) => c.slug !== "all" && c.productCount > 0 || ["women", "men", "kids", "accessories", "footwear"].includes(c.slug)));
        }
      } catch (err) {
        console.warn("Failed to load categories:", err);
      }
    }
    fetchCats();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <h2 className="font-display text-3xl text-stone-900 mb-8 text-center">Shop by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id || cat.slug}
            to={`/products?category=${cat.slug}`}
            className="group relative overflow-hidden aspect-square"
          >
            <img
              src={catImages[cat.slug] || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=70"}
              alt={cat.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-stone-900/40 group-hover:bg-stone-900/55 transition-colors" />
            <span className="absolute inset-0 flex items-end justify-center pb-4 font-display text-white text-xl">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        setLoading(true);
        const res = await shopApi.getProducts({ limit: 8, sortBy: "rating" });
        if (res?.data?.products) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.warn("Failed to load featured products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-3xl text-stone-900">Featured Products</h2>
        <Link
          to="/products"
          className="text-sm text-stone-600 hover:text-stone-900 underline underline-offset-4 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function PromoStrip() {
  return (
    <section className="bg-amber-50 border-y border-amber-100 py-12 my-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { Icon: Truck, title: "Free Shipping", sub: "On orders above ₹999" },
            { Icon: RefreshCw, title: "Easy Returns", sub: "30-day hassle-free returns" },
            { Icon: Shield, title: "Secure Payments", sub: "256-bit SSL encrypted" },
            { Icon: Headphones, title: "24/7 Support", sub: "Here to help, always" },
          ].map(({ Icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Icon size={18} className="text-amber-700" />
              </div>
              <p className="font-display text-base text-stone-900">{title}</p>
              <p className="text-xs text-stone-500">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DealBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="relative overflow-hidden h-64 bg-stone-800 flex items-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-stone-900/50" />
          <div className="relative px-8">
            <p className="text-amber-400 text-xs tracking-widest uppercase mb-2">Up to 50% off</p>
            <h3 className="font-display text-3xl text-white mb-4">Women's Sale</h3>
            <Link
              to="/products?category=women"
              className="text-sm text-white border-b border-white hover:text-amber-400 hover:border-amber-400 transition-colors pb-0.5"
            >
              Shop Now →
            </Link>
          </div>
        </div>
        <div
          className="relative overflow-hidden h-64 bg-stone-800 flex items-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-stone-900/50" />
          <div className="relative px-8">
            <p className="text-amber-400 text-xs tracking-widest uppercase mb-2">New Season</p>
            <h3 className="font-display text-3xl text-white mb-4">Men's Collection</h3>
            <Link
              to="/products?category=men"
              className="text-sm text-white border-b border-white hover:text-amber-400 hover:border-amber-400 transition-colors pb-0.5"
            >
              Shop Now →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main>
      <HeroBanner />
      <CategoryStrip />
      <FeaturedProducts />
      <PromoStrip />
      <DealBanner />
    </main>
  );
}
