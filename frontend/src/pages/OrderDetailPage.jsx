import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Package,
  Calendar,
  ChevronLeft,
  MapPin,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  Truck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as shopApi from "../api/shopApi";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/login?redirect=/orders/${id}`);
      return;
    }

    if (id && token) {
      loadOrderDetail();
    }
  }, [id, token, authLoading, isAuthenticated, navigate]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await shopApi.getOrderById(id, token);
      setOrder(res?.data);
    } catch (err) {
      setActionError(err.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order? Any reserved inventory will be released.")) {
      return;
    }

    setActionError("");
    setActionSuccess("");
    setCancelling(true);

    try {
      const res = await shopApi.cancelOrder(order.id, token);
      setOrder(res?.data);
      setActionSuccess("Order has been successfully cancelled.");
    } catch (err) {
      setActionError(err.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const isCancelable = order && (order.status === "PENDING" || order.status === "CONFIRMED");

  if (loading || authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <Loader2 className="animate-spin text-stone-400 mx-auto" size={32} />
        <p className="text-stone-500 text-sm mt-3">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl text-stone-900 mb-2">Order Not Found</h2>
        <p className="text-stone-500 text-sm mb-6">{actionError || "Unable to locate this order."}</p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 text-xs font-semibold hover:bg-amber-700 transition-colors"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const steps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentStepIdx = steps.indexOf(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb Back Link */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Back to All Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl text-stone-900">Order #{order.orderNumber}</h1>
            <span
              className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-xs border ${
                order.status === "DELIVERED"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : order.status === "CANCELLED"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
            <Calendar size={13} />
            Placed on {formattedDate}
          </p>
        </div>

        {isCancelable && (
          <button
            type="button"
            disabled={cancelling}
            onClick={handleCancelOrder}
            className="border border-rose-300 text-rose-700 px-5 py-2.5 text-xs font-semibold hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 self-start sm:self-auto"
          >
            {cancelling ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
            Cancel Order
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-500" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Lifecycle Progress Bar */}
      {order.status !== "CANCELLED" && (
        <div className="bg-white border border-stone-200 p-6 rounded-xs mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-6">
            Order Status Progression
          </h3>

          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {steps.map((step, idx) => {
              const isPastOrCurrent = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div key={step} className="space-y-2">
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      isPastOrCurrent ? "bg-amber-600" : "bg-stone-100"
                    }`}
                  />
                  <span
                    className={`block text-[11px] font-semibold ${
                      isCurrent ? "text-amber-700" : isPastOrCurrent ? "text-stone-900" : "text-stone-300"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Order Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-stone-200 p-6 rounded-xs">
            <h3 className="font-display text-base text-stone-900 mb-4 flex items-center gap-2">
              <Package size={16} className="text-stone-500" />
              Items in this Order ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-stone-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-center">
                  {item.product?.image ? (
                    <img
                      src={item.product.image}
                      alt={item.productName}
                      className="w-16 h-20 object-cover bg-stone-50 border border-stone-100 flex-none"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-stone-100 flex items-center justify-center text-stone-300">
                      <Package size={20} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900">{item.productName}</p>
                    <p className="text-xs text-stone-400 mt-0.5">Quantity: {item.quantity}</p>
                    {item.product?.slug && (
                      <Link
                        to={`/products/${item.product.id || item.product.slug}`}
                        className="text-xs text-amber-700 hover:underline mt-1 inline-block"
                      >
                        View Product & Leave Review →
                      </Link>
                    )}
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-semibold text-stone-900">₹{Number(item.subtotal).toFixed(2)}</p>
                    <p className="text-xs text-stone-400">₹{Number(item.unitPrice).toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Address & Pricing Summary */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white border border-stone-200 p-6 rounded-xs">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin size={14} className="text-stone-500" />
              Delivery Address
            </h4>
            {order.address ? (
              <div className="text-xs text-stone-600 leading-relaxed space-y-1">
                <p className="font-semibold text-stone-900 text-sm">{order.address.fullName}</p>
                <p>{order.address.addressLine1}</p>
                {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                <p>
                  {order.address.city}, {order.address.state} {order.address.postalCode}
                </p>
                <p>{order.address.country}</p>
              </div>
            ) : (
              <p className="text-xs text-stone-400">No address recorded.</p>
            )}
          </div>

          {/* Payment & Breakdown */}
          <div className="bg-stone-50 border border-stone-200 p-6 rounded-xs space-y-4">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={14} className="text-stone-500" />
              Payment Summary
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-medium text-stone-900">₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping:</span>
                <span className="font-medium text-stone-900">
                  {Number(order.shippingAmount) === 0 ? "Free" : `₹${Number(order.shippingAmount).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated Tax:</span>
                <span className="font-medium text-stone-900">₹{Number(order.taxAmount).toFixed(2)}</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-semibold text-sm text-stone-900">
                <span>Total Amount:</span>
                <span>₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
              <span className="text-stone-500">Payment Status:</span>
              <span className="font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-xs">
                {order.payment?.status || order.paymentStatus || "PENDING"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
