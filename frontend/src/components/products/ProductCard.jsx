import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useCart } from "../../context/ShopContext";
import { useWishlist } from "../../context/ShopContext";

export default function ProductCard({ product }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { cart, dispatch: cartDispatch } = useCart();
  const { wishlist, dispatch: wishDispatch } = useWishlist();

  const isWished = wishlist.some((i) => i.id === product.id);
  const inCart = cart.some((i) => i.id === product.id);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const categoryName = typeof product.category === "object" ? product.category?.name : product.category;
  const reviewCount = product.reviewCount ?? (Array.isArray(product.reviews) ? product.reviews.length : product.reviews) ?? 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    cartDispatch({
      type: "ADD",
      item: {
        ...product,
        size: (product.sizes && product.sizes[0]) || "Standard",
        color: (product.colors && product.colors[0]) || "Default",
      },
    });
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    wishDispatch({ type: "TOGGLE", item: product });
  };

  return (
    <Link
      to={`/products/${product.slug || product.id}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden bg-stone-50 aspect-[3/4]">
        {/* Skeleton before image loads */}
        {!imgLoaded && (
          <div className="skeleton absolute inset-0" />
        )}

        <img
          src={product.image || product.images?.[0] || "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&q=80"}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          } ${hovered ? "scale-105" : "scale-100"}`}
        />

        {/* Badge */}
        {product.badge && (
          <span className="absolute top-2 left-2 bg-stone-900 text-white text-xs px-2 py-1 font-body tracking-wide">
            {product.badge}
          </span>
        )}

        {/* Discount */}
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-amber-600 text-white text-xs px-2 py-1 font-body font-semibold">
            -{discount}%
          </span>
        )}

        {/* Actions overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 flex gap-2 p-3 transition-all duration-300 ${
            hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
              inCart
                ? "bg-stone-700 text-white"
                : "bg-white text-stone-900 hover:bg-stone-900 hover:text-white"
            }`}
          >
            <ShoppingBag size={14} />
            {inCart ? "In Bag" : "Quick Add"}
          </button>

          <button
            onClick={handleWishlist}
            className={`p-2.5 transition-colors ${
              isWished
                ? "bg-rose-500 text-white"
                : "bg-white text-stone-900 hover:bg-rose-500 hover:text-white"
            }`}
            aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={14} fill={isWished ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="pt-3 space-y-1">
        {categoryName && (
          <p className="text-xs text-stone-400 uppercase tracking-widest font-body">
            {categoryName}
          </p>
        )}
        <h3 className="font-display text-base text-stone-900 leading-tight">
          {product.name}
        </h3>
        <div className="flex items-center gap-1">
          <Star size={11} className="text-amber-500 fill-amber-500" />
          <span className="text-xs text-stone-500">{product.rating || 5} ({reviewCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-900">
            ₹{Number(product.price || 0).toLocaleString()}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-stone-400 line-through">
              ₹{Number(product.originalPrice).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
