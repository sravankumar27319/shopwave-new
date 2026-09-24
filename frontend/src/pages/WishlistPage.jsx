import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useWishlist, useCart } from "../context/ShopContext";

export default function WishlistPage() {
  const { wishlist, dispatch: wishDispatch } = useWishlist();
  const { cart, dispatch: cartDispatch } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <Heart size={36} className="text-rose-200" />
        </div>
        <h2 className="font-display text-3xl text-stone-900 mb-2">Your wishlist is empty</h2>
        <p className="text-stone-400 text-sm mb-8">Save items you love and come back to them later.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3.5 text-sm font-semibold hover:bg-amber-700 transition-colors"
        >
          Discover Products
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl text-stone-900">Wishlist</h1>
        <span className="text-sm text-stone-400">{wishlist.length} items</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {wishlist.map((item) => {
          const inCart = cart.some((c) => c.id === item.id);
          const discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);

          return (
            <div key={item.id} className="group bg-white border border-stone-100 overflow-hidden">
              {/* Image */}
              <div className="relative aspect-3/4 overflow-hidden bg-stone-50">
                <Link to={`/products/${item.id}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <button
                  onClick={() => wishDispatch({ type: "TOGGLE", item })}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-amber-600 text-white text-xs px-2 py-0.5 font-semibold">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                {typeof item.category === "object" ? (
                  <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">{item.category?.name}</p>
                ) : item.category ? (
                  <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">{item.category}</p>
                ) : null}
                <Link
                  to={`/products/${item.slug || item.id}`}
                  className="font-display text-base text-stone-900 hover:text-amber-700 transition-colors leading-tight block mb-2"
                >
                  {item.name}
                </Link>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-stone-900">
                    ₹{Number(item.price || 0).toLocaleString()}
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-xs text-stone-400 line-through">
                      ₹{Number(item.originalPrice).toLocaleString()}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    cartDispatch({
                      type: "ADD",
                      item: {
                        ...item,
                        size: (item.sizes && item.sizes[0]) || "Standard",
                        color: (item.colors && item.colors[0]) || "Default",
                      },
                    });
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                    inCart
                      ? "bg-stone-100 text-stone-600"
                      : "bg-stone-900 text-white hover:bg-amber-700"
                  }`}
                >
                  <ShoppingBag size={13} />
                  {inCart ? "In Bag" : "Move to Bag"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
