import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingBag, Star, Truck, RefreshCw, ChevronRight, Plus, Minus, MessageSquare, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCart, useWishlist } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/products/ProductCard";
import { ProductDetailSkeleton } from "../components/ui/Skeletons";
import * as shopApi from "../api/shopApi";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user, token, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState("description");

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");

  const { dispatch: cartDispatch } = useCart();
  const { wishlist, dispatch: wishDispatch } = useWishlist();

  useEffect(() => {
    let isCancelled = false;
    async function fetchProduct() {
      setLoading(true);
      setActiveImg(0);
      setSelectedSize(null);
      setSelectedColor(null);
      setQty(1);
      setAdded(false);
      try {
        const res = await shopApi.getProductById(id);
        const prod = res?.data;
        if (!isCancelled && prod) {
          setProduct(prod);
          if (prod.sizes?.length) setSelectedSize(prod.sizes[0]);
          if (prod.colors?.length) setSelectedColor(prod.colors[0]);

          // Fetch related products
          const catSlug = prod.category?.slug || (typeof prod.category === "string" ? prod.category : undefined);
          if (catSlug) {
            shopApi.getProducts({ category: catSlug, limit: 5 }).then((relRes) => {
              if (!isCancelled && relRes?.data?.products) {
                setRelated(relRes.data.products.filter((p) => p.id !== prod.id && p.slug !== prod.slug).slice(0, 4));
              }
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn("Could not load product:", err);
        if (!isCancelled) setProduct(null);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchProduct();
    loadReviews();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await shopApi.getProductReviews(id);
      setReviews(res?.data || []);
    } catch (err) {
      console.warn("Could not load backend reviews:", err?.message || err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      setReviewError("Please provide a review comment.");
      return;
    }

    setReviewError("");
    setReviewSuccess("");
    setSubmittingReview(true);

    try {
      await shopApi.createReview(
        product?.id || id,
        {
          rating: Number(reviewRating),
          comment: reviewComment.trim(),
        },
        token
      );

      setReviewSuccess("Your review has been submitted successfully!");
      setReviewComment("");
      setReviewRating(5);
      await loadReviews();
    } catch (err) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete your review?")) return;
    try {
      await shopApi.deleteReview(reviewId, token);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      setReviewError(err.message || "Failed to delete review.");
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return (
    <div className="text-center py-24">
      <p className="font-display text-3xl text-stone-400">Product not found</p>
      <Link to="/products" className="text-sm text-amber-600 underline mt-4 block">Back to shop</Link>
    </div>
  );

  const isWished = wishlist.some((i) => String(i.id) === String(product?.id));
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const categoryName = typeof product.category === "object" ? product.category?.name : product.category;
  const categorySlug = typeof product.category === "object" ? product.category?.slug : product.category;
  const productImages = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : []);

  const handleAddToCart = () => {
    cartDispatch({
      type: "ADD",
      item: {
        ...product,
        size: selectedSize || (product.sizes && product.sizes[0]) || "Standard",
        color: selectedColor || (product.colors && product.colors[0]) || "Default",
        qty,
      },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-400 mb-6">
        <Link to="/" className="hover:text-stone-600">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-stone-600">Products</Link>
        {categoryName && (
          <>
            <ChevronRight size={12} />
            <Link to={`/products?category=${categorySlug}`} className="hover:text-stone-600 capitalize">
              {categoryName}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-stone-600 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-4/5 overflow-hidden bg-stone-50">
            <img
              src={productImages[activeImg] || productImages[0] || product.image || ""}
              alt={product.name}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>
          {productImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {productImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-20 h-20 flex-none overflow-hidden border-2 transition-colors ${
                    i === activeImg ? "border-stone-900" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {categoryName && (
            <span className="text-xs text-stone-400 uppercase tracking-widest">{categoryName}</span>
          )}
          <h1 className="font-display text-3xl text-stone-900 mt-1 mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.floor(product.rating || 5) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <span className="text-xs text-stone-500">
              {product.rating || 5} ({reviews.length > 0 ? `${reviews.length} verified reviews` : `${product.reviewCount ?? (Array.isArray(product.reviews) ? product.reviews.length : product.reviews) ?? 0} reviews`})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display text-2xl font-bold text-stone-900">
              ₹{Number(product.price || 0).toLocaleString()}
            </span>
            {discount > 0 && (
              <>
                <span className="text-sm text-stone-400 line-through">
                  ₹{Number(product.originalPrice).toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-xs">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Color Selector */}
          {(product.colors && product.colors.length > 0) && (
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">Color</label>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      (selectedColor || product.colors[0]) === c
                        ? "border-stone-900 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {(product.sizes && product.sizes.length > 0) && (
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">Size</label>
              <div className="flex gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                      (selectedSize || product.sizes[0]) === s
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6 flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">Quantity</label>
            <div className="flex items-center border border-stone-200">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-2.5 py-1 text-stone-600 hover:text-stone-900"
              >
                <Minus size={12} />
              </button>
              <span className="px-3 text-sm border-x border-stone-200">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-2.5 py-1 text-stone-600 hover:text-stone-900"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold tracking-wide transition-all ${
                added
                  ? "bg-green-600 text-white"
                  : "bg-stone-900 text-white hover:bg-amber-700"
              }`}
            >
              <ShoppingBag size={16} />
              {added ? "Added to Bag!" : "Add to Bag"}
            </button>
            <button
              onClick={() => wishDispatch({ type: "TOGGLE", item: product })}
              className={`p-3.5 border transition-colors ${
                isWished
                  ? "border-rose-500 bg-rose-50 text-rose-500"
                  : "border-stone-200 text-stone-700 hover:border-rose-400 hover:text-rose-400"
              }`}
              aria-label="Wishlist"
            >
              <Heart size={18} fill={isWished ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Delivery info */}
          <div className="space-y-2 border-t border-stone-100 pt-5">
            {[
              { Icon: Truck, text: "Free delivery on orders above ₹999" },
              { Icon: RefreshCw, text: "Easy 30-day returns & exchanges" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-stone-500">
                <Icon size={13} />
                {text}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mt-8 border-t border-stone-100">
            <div className="flex gap-6 mb-4 pt-4 border-b border-stone-100">
              {["description", "features", "reviews"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-sm capitalize pb-2 border-b-2 transition-colors ${
                    tab === t ? "border-stone-900 text-stone-900 font-semibold" : "border-transparent text-stone-400"
                  }`}
                >
                  {t === "reviews" ? `Reviews (${reviews.length})` : t}
                </button>
              ))}
            </div>

            {tab === "description" && (
              <p className="text-sm text-stone-600 leading-relaxed">{product.description}</p>
            )}

            {tab === "features" && (
              <ul className="space-y-2">
                {product.features?.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-none" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {tab === "reviews" && (
              <div className="space-y-6 pt-2">
                {/* Submit review form */}
                {isAuthenticated ? (
                  <form onSubmit={handleReviewSubmit} className="bg-stone-50 p-4 border border-stone-200 rounded-xs space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-amber-700" />
                      Write a Customer Review
                    </h4>

                    {reviewSuccess && (
                      <div className="p-2 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xs flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-green-600" />
                        <span>{reviewSuccess}</span>
                      </div>
                    )}

                    {reviewError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-rose-600" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs text-stone-600 mb-1">Rating (1 to 5 Stars):</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-1 text-amber-500 hover:scale-110 transition-transform"
                          >
                            <Star size={18} fill={star <= reviewRating ? "currentColor" : "none"} />
                          </button>
                        ))}
                        <span className="text-xs font-semibold text-stone-700 ml-2">{reviewRating} / 5</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-stone-600 mb-1">Your Review Comment:</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this item..."
                        className="w-full border border-stone-300 p-2.5 text-xs rounded-xs focus:outline-none focus:border-stone-900 bg-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="bg-stone-900 text-white px-4 py-2 text-xs font-semibold hover:bg-amber-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {submittingReview ? <Loader2 className="animate-spin" size={12} /> : null}
                        Submit Review
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xs text-xs text-stone-600 flex items-center justify-between">
                    <span>Have you purchased this item? Sign in to leave a review.</span>
                    <Link to="/login" className="font-semibold text-amber-700 hover:underline">
                      Sign In →
                    </Link>
                  </div>
                )}

                {/* Reviews List */}
                {loadingReviews ? (
                  <div className="py-4 text-center text-xs text-stone-400">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No customer reviews yet. Be the first to share your thoughts!</p>
                ) : (
                  <div className="divide-y divide-stone-100 space-y-4">
                    {reviews.map((r) => {
                      const isAuthor = user?.id === r.user?.id;
                      return (
                        <div key={r.id} className="pt-3 first:pt-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-stone-900">{r.user?.name || "Customer"}</span>
                              <div className="flex text-amber-500">
                                {[...Array(5)].map((_, idx) => (
                                  <Star
                                    key={idx}
                                    size={11}
                                    fill={idx < r.rating ? "currentColor" : "none"}
                                  />
                                ))}
                              </div>
                            </div>
                            {isAuthor && (
                              <button
                                onClick={() => handleDeleteReview(r.id)}
                                className="text-stone-300 hover:text-rose-500 transition-colors"
                                title="Delete your review"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed">{r.comment}</p>
                          <span className="text-[10px] text-stone-400 block mt-1">
                            {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl text-stone-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
