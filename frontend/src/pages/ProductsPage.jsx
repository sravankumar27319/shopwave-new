import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import ProductCard from "../components/products/ProductCard";
import { ProductCardSkeleton } from "../components/ui/Skeletons";
import * as shopApi from "../api/shopApi";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([{ id: "all", slug: "all", name: "All" }]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("featured");
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("search") || "";

  // Load categories
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await shopApi.getCategories();
        if (res?.data) {
          setCategoriesList([
            { id: "all", slug: "all", name: "All" },
            ...res.data.filter((c) => ["women", "men", "kids", "accessories", "footwear"].includes(c.slug) || c.productCount > 0),
          ]);
        }
      } catch (err) {
        console.warn("Failed to load categories:", err);
      }
    }
    loadCats();
  }, []);

  // Fetch products from backend
  useEffect(() => {
    let isCancelled = false;
    async function loadProducts() {
      setLoading(true);
      try {
        let sortByParam = undefined;
        if (sort === "price-asc") sortByParam = "price_asc";
        else if (sort === "price-desc") sortByParam = "price_desc";
        else if (sort === "rating") sortByParam = "rating";
        else if (sort === "newest") sortByParam = "newest";

        const res = await shopApi.getProducts({
          category: categoryParam !== "all" ? categoryParam : undefined,
          search: searchParam || undefined,
          sortBy: sortByParam,
          limit: 100,
        });

        if (!isCancelled && res?.data?.products) {
          setProductsList(res.data.products);
        }
      } catch (err) {
        console.warn("Failed to load products from API:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      isCancelled = true;
    };
  }, [categoryParam, searchParam, sort]);

  const filtered = useMemo(() => {
    return productsList.filter((p) => {
      const price = Number(p.price || 0);
      const rating = Number(p.rating || 0);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesRating = selectedRating ? rating >= selectedRating : true;
      return matchesPrice && matchesRating;
    });
  }, [productsList, priceRange, selectedRating]);

  const setCategory = (catSlug) => {
    const params = new URLSearchParams(searchParams);
    if (catSlug === "all") {
      params.delete("category");
    } else {
      params.set("category", catSlug);
    }
    params.delete("search");
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-4xl text-stone-900 capitalize">
          {searchParam
            ? `Results for "${searchParam}"`
            : categoryParam === "all"
            ? "All Products"
            : categoryParam}
        </h1>
        <p className="text-sm text-stone-400 mt-1">{filtered.length} items</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categoriesList.map((cat) => {
          const catId = cat.slug || cat.id;
          const isActive = categoryParam === catId || (catId === "all" && categoryParam === "all");
          return (
            <button
              key={cat.id || cat.slug}
              onClick={() => setCategory(catId)}
              className={`flex-none px-4 py-2 text-sm font-body tracking-wide border transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
            >
              {cat.name || cat.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters — desktop */}
        <aside className="hidden lg:block w-56 flex-none">
          <FilterPanel
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            selectedRating={selectedRating}
            onRatingChange={setSelectedRating}
          />
        </aside>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5">
            <button
              className="lg:hidden flex items-center gap-2 text-sm text-stone-600 border border-stone-200 px-3 py-2"
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-stone-400 hidden sm:block">Sort by</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-sm border border-stone-200 px-3 py-2 pr-8 appearance-none bg-white focus:outline-none focus:border-stone-400 cursor-pointer"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-stone-400 mb-2">No products found</p>
              <p className="text-sm text-stone-400">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-900/40"
            onClick={() => setFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl">Filters</h3>
              <button onClick={() => setFilterOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <FilterPanel
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              selectedRating={selectedRating}
              onRatingChange={setSelectedRating}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({ priceRange, onPriceChange, selectedRating, onRatingChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
          Price Range
        </h4>
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={15000}
            step={500}
            value={priceRange[1]}
            onChange={(e) => onPriceChange([priceRange[0], +e.target.value])}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-stone-500">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
          Rating
        </h4>
        {[4, 3, 2].map((r) => (
          <label key={r} className="flex items-center gap-2 py-1 cursor-pointer text-sm text-stone-600">
            <input
              type="checkbox"
              checked={selectedRating === r}
              onChange={() => onRatingChange(selectedRating === r ? 0 : r)}
              className="accent-amber-600 cursor-pointer"
            />
            {"★".repeat(r)}{"☆".repeat(5 - r)} & above
          </label>
        ))}
      </div>
    </div>
  );
}
