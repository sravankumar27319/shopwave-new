import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Calendar, ChevronRight, ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as shopApi from "../api/shopApi";

export default function OrdersPage() {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/orders");
      return;
    }

    if (token) {
      loadOrders();
    }
  }, [token, authLoading, isAuthenticated, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await shopApi.getOrders(token);
      setOrders(res?.data?.orders || []);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PROCESSING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "SHIPPED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "DELIVERED":
        return "bg-green-50 text-green-700 border-green-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <Loader2 className="animate-spin text-stone-400 mx-auto" size={32} />
        <p className="text-stone-500 text-sm mt-3">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
          <Package size={36} className="text-stone-300" />
        </div>
        <h2 className="font-display text-3xl text-stone-900 mb-2">No orders found</h2>
        <p className="text-stone-400 text-sm mb-8">You haven't placed any orders with ShopWave yet.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3.5 text-sm font-semibold hover:bg-amber-700 transition-colors"
        >
          Explore Catalog
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-stone-900">My Orders</h1>
        <p className="text-stone-500 text-sm mt-1">Track, review, or manage your recent purchases.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xs">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={order.id}
              className="bg-white border border-stone-200 rounded-xs p-6 hover:border-stone-400 transition-colors shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-stone-900">#{order.orderNumber}</span>
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-xs ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 flex items-center gap-1">
                    <Calendar size={13} />
                    Placed on {dateStr}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-stone-400 block">Total Amount</span>
                    <span className="text-base font-bold text-stone-900">
                      ₹{Number(order.totalAmount).toLocaleString()}
                    </span>
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-300 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
                  >
                    View Details
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
                <span>Items: {order.itemCount} item(s)</span>
                <span>
                  Payment Status:{" "}
                  <strong className="text-stone-800">{order.paymentStatus || "PENDING"}</strong>
                </span>
                {order.address && (
                  <span>
                    Ship To: <strong className="text-stone-800">{order.address.fullName}</strong> ({order.address.city})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
