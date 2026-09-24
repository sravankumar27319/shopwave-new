import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Calendar, MapPin, Loader2, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as shopApi from "../api/shopApi";

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const { token, user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // emailSent / customerEmail come from CheckoutPage via navigate() state
  const emailSent = location.state?.emailSent ?? null;   // null = unknown (e.g. page refresh)
  const emailRecipient = location.state?.customerEmail || user?.email || "your registered email";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (orderId && token) {
      loadOrderDetails();
    }
  }, [orderId, token, authLoading, isAuthenticated, navigate]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await shopApi.getOrderById(orderId, token);
      setOrder(res?.data);
    } catch (err) {
      setError(err.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <Loader2 className="animate-spin text-stone-400 mx-auto" size={32} />
        <p className="text-stone-500 text-sm mt-3">Loading order confirmation...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl text-stone-900 mb-2">Order Not Found</h2>
        <p className="text-stone-500 text-sm mb-6">{error || "Unable to locate confirmation details."}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 text-xs font-semibold hover:bg-amber-700 transition-colors"
        >
          Continue Shopping
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Success Banner */}
      <div className="bg-white border border-stone-200 p-8 text-center rounded-xs shadow-xs mb-8">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-stone-900">Thank You for Your Order!</h1>
        <p className="text-stone-500 text-sm mt-2 max-w-md mx-auto">
          Your payment has been successfully processed and your order is confirmed.
        </p>

        <div className="mt-4 flex flex-col items-center gap-2">
          {/* Email status badge — only shown when state is known */}
          {emailSent === true && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-full">
              <Mail size={13} />
              <span>Confirmation email sent to <strong>{emailRecipient}</strong></span>
            </div>
          )}
          {emailSent === false && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-full">
              <AlertCircle size={13} />
              <span>Your order is confirmed, but we couldn&apos;t send the confirmation email. Check your orders page for details.</span>
            </div>
          )}
          {/* emailSent === null means page was refreshed — show neutral note */}
          {emailSent === null && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-50 border border-stone-200 text-stone-500 text-xs rounded-full">
              <Mail size={13} />
              <span>A confirmation email was sent to <strong>{emailRecipient}</strong> (if delivery succeeded)</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Meta & Status */}
      <div className="bg-white border border-stone-200 p-6 rounded-xs mb-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-stone-100 text-xs">
          <div>
            <span className="text-stone-400 uppercase tracking-wider block mb-0.5">Order Number</span>
            <span className="font-mono font-semibold text-stone-900 text-sm">#{order.orderNumber}</span>
          </div>
          <div>
            <span className="text-stone-400 uppercase tracking-wider block mb-0.5">Date Placed</span>
            <span className="font-medium text-stone-900">{formattedDate}</span>
          </div>
          <div>
            <span className="text-stone-400 uppercase tracking-wider block mb-0.5">Payment Status</span>
            <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 font-semibold rounded-xs text-[11px]">
              {order.payment?.status || order.paymentStatus || "SUCCESS"}
            </span>
          </div>
          <div>
            <span className="text-stone-400 uppercase tracking-wider block mb-0.5">Order Status</span>
            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-xs text-[11px]">
              {order.status || "CONFIRMED"}
            </span>
          </div>
        </div>

        {/* Ordered Items */}
        <div>
          <h3 className="font-display text-base text-stone-900 mb-4 flex items-center gap-2">
            <Package size={16} className="text-stone-500" />
            Items in this Order
          </h3>

          <div className="divide-y divide-stone-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex gap-4 items-center">
                {item.product?.image ? (
                  <img
                    src={item.product.image}
                    alt={item.productName}
                    className="w-14 h-16 object-cover bg-stone-50 border border-stone-100 flex-none"
                  />
                ) : (
                  <div className="w-14 h-16 bg-stone-100 flex items-center justify-center text-stone-300">
                    <ShoppingBag size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{item.productName}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right text-sm">
                  <span className="font-semibold text-stone-900">₹{Number(item.subtotal).toFixed(2)}</span>
                  <p className="text-[11px] text-stone-400">₹{Number(item.unitPrice).toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address & Calculation Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-stone-100">
          {/* Address */}
          <div>
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin size={13} className="text-stone-500" />
              Delivery Address
            </h4>
            {order.address ? (
              <div className="bg-stone-50 p-4 rounded-xs text-xs text-stone-600 leading-relaxed">
                <p className="font-semibold text-stone-900">{order.address.fullName}</p>
                <p>{order.address.addressLine1}</p>
                {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                <p>
                  {order.address.city}, {order.address.state} {order.address.postalCode}
                </p>
                <p>{order.address.country}</p>
              </div>
            ) : (
              <p className="text-xs text-stone-400">Standard Delivery</p>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-stone-50 p-4 rounded-xs space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span>₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Shipping:</span>
              <span>{Number(order.shippingAmount) === 0 ? "Free" : `₹${Number(order.shippingAmount).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Estimated Tax:</span>
              <span>₹{Number(order.taxAmount).toFixed(2)}</span>
            </div>
            <div className="border-t border-stone-200 pt-2 flex justify-between font-semibold text-sm text-stone-900">
              <span>Total Paid:</span>
              <span>₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link
          to="/orders"
          className="bg-stone-900 text-white px-8 py-3.5 text-sm font-semibold hover:bg-amber-700 transition-colors text-center"
        >
          View My Orders
        </Link>
        <Link
          to="/products"
          className="border border-stone-300 text-stone-800 px-8 py-3.5 text-sm font-semibold hover:bg-stone-50 transition-colors text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
