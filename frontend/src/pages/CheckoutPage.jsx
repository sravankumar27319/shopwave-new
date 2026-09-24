import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Loader2,
  Trash2,
  Building,
} from "lucide-react";
import { useCart } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import * as shopApi from "../api/shopApi";

export default function CheckoutPage() {
  const { cart, dispatch } = useCart();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // New Address Form State
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Redirect to login if unauthenticated once auth is initialized
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/checkout");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load saved delivery addresses
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadAddresses();
    }
  }, [authLoading, isAuthenticated, token]);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await shopApi.getAddresses(token);
      const list = res?.data || [];
      setAddresses(list);
      if (list.length > 0) {
        setSelectedAddressId((prev) => {
          if (prev && list.some((a) => a.id === prev)) return prev;
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          return defaultAddr.id;
        });
      }
    } catch (err) {
      console.error("Failed to load addresses:", err.message);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      setSavingAddress(true);
      const res = await shopApi.createAddress(addressForm, token);
      const newAddress = res?.data;
      if (newAddress) {
        setAddresses((prev) => [newAddress, ...prev]);
        setSelectedAddressId(newAddress.id);
      }
      setShowAddressModal(false);
      setAddressForm({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "United States",
        isDefault: false,
      });
    } catch (err) {
      setErrorMessage(err.message || "Could not save address. Please verify your details.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("Are you sure you want to remove this address?")) return;
    try {
      await shopApi.deleteAddress(addressId, token);
      // Update addresses using functional update to avoid stale state
      setAddresses((prev) => {
        const updated = prev.filter((a) => a.id !== addressId);
        // Update selected address if it was the one deleted
        if (selectedAddressId === addressId) {
          setSelectedAddressId(updated[0]?.id || "");
        }
        return updated;
      });
    } catch (err) {
      setErrorMessage(err.message || "Unable to delete address.");
    }
  };

  // Calculations
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const estimatedTax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + shipping + estimatedTax;

  // Step 1: Create Order & Open Payment Gateway
  const handleProceedToPayment = async () => {
    if (!selectedAddressId) {
      setErrorMessage("Please select or add a delivery address.");
      return;
    }
    if (cart.length === 0) {
      setErrorMessage("Your bag is empty. Please add items before checking out.");
      return;
    }

    setErrorMessage("");
    setSubmittingOrder(true);

    try {
      // Sync items to backend checkout
      const checkoutPayload = {
        addressId: selectedAddressId,
        items: cart.map((i) => ({
          // Use the product slug (matches backend DB slug) instead of the numeric local ID
          productId: i.slug || String(i.id),
          quantity: i.qty,
        })),
      };

      const orderRes = await shopApi.checkout(checkoutPayload, token);
      const order = orderRes?.data;
      if (!order || !order.id) {
        throw new Error("Order creation failed. Please try again.");
      }
      setCurrentOrder(order);

      // Initialize Payment Session
      const paymentRes = await shopApi.createPayment(order.id, token);
      setPaymentSession(paymentRes?.data);

      // Open Mock Payment Modal
      setPaymentModalOpen(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to initiate checkout. Please try again.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Step 2: Complete Payment Verification
  const handleCompletePayment = async (simulateFailure = false) => {
    if (!currentOrder) return;
    setProcessingPayment(true);
    setPaymentError("");

    try {
      const verifyRes = await shopApi.verifyPayment(
        {
          orderId: currentOrder.id,
          providerPaymentId: paymentSession?.providerPaymentId,
          payload: simulateFailure ? { simulateFailure: true } : undefined,
        },
        token
      );

      if (verifyRes.success) {
        // Clear Cart and Navigate to Order Success Page
        // Pass emailSent flag and email address via router state
        dispatch({ type: "CLEAR" });
        setPaymentModalOpen(false);
        navigate(`/order-success/${currentOrder.id}`, {
          state: {
            emailSent: verifyRes.emailSent === true,
            customerEmail: verifyRes.customerEmail || user?.email,
          },
        });
      } else {
        setPaymentError(verifyRes.message || "Payment verification declined by provider.");
      }
    } catch (err) {
      setPaymentError(err.message || "Payment verification failed.");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2 className="animate-spin text-stone-400 mx-auto" size={32} />
        <p className="text-stone-500 text-sm mt-3">Loading checkout details...</p>
      </div>
    );
  }

  if (cart.length === 0 && !currentOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={36} className="text-stone-300" />
        </div>
        <h2 className="font-display text-3xl text-stone-900 mb-2">Your bag is empty</h2>
        <p className="text-stone-400 text-sm mb-8">Add items to your shopping bag to proceed with checkout.</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-stone-900">Checkout</h1>
        <p className="text-stone-500 text-sm mt-1">Review your address, order items, and payment.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xs flex items-center gap-2">
          <AlertCircle size={18} className="flex-none text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Customer & Delivery Address */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer Profile Card */}
          <div className="bg-white border border-stone-200 p-6 rounded-xs">
            <h2 className="font-display text-lg text-stone-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-mono">
                1
              </span>
              Customer Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-stone-50 p-3.5 rounded-xs border border-stone-100">
                <span className="text-xs text-stone-400 uppercase tracking-wider block">Full Name</span>
                <span className="font-semibold text-stone-900">{user?.name || "Customer"}</span>
              </div>
              <div className="bg-stone-50 p-3.5 rounded-xs border border-stone-100">
                <span className="text-xs text-stone-400 uppercase tracking-wider block">Email Address</span>
                <span className="font-semibold text-stone-900">{user?.email || "Signed in"}</span>
              </div>
            </div>
          </div>

          {/* Delivery Addresses */}
          <div className="bg-white border border-stone-200 p-6 rounded-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-stone-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-mono">
                  2
                </span>
                Shipping Address
              </h2>
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
              >
                <Plus size={15} />
                Add New Address
              </button>
            </div>

            {loadingAddresses ? (
              <div className="py-8 text-center text-stone-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} /> Loading saved addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 border border-dashed border-stone-200 rounded-xs p-6">
                <MapPin size={28} className="mx-auto text-stone-300 mb-2" />
                <p className="text-stone-700 font-medium text-sm">No saved addresses found</p>
                <p className="text-stone-400 text-xs mb-4">Please add a shipping address to proceed.</p>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="bg-stone-900 text-white px-5 py-2 text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  Add Delivery Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative p-4 border cursor-pointer transition-all rounded-xs ${
                        isSelected
                          ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"
                          : "border-stone-200 hover:border-stone-400 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="deliveryAddress"
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="accent-stone-900"
                          />
                          <span className="text-sm font-semibold text-stone-900">{addr.fullName}</span>
                        </div>
                        {addr.isDefault && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-xs">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 text-xs text-stone-600 space-y-0.5 leading-relaxed pl-5">
                        <p>{addr.addressLine1}</p>
                        {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                        <p>
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p>{addr.country}</p>
                        <p className="text-stone-400 mt-1">Phone: {addr.phone}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-200/60 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(addr.id);
                          }}
                          className="text-[11px] text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="bg-white border border-stone-200 p-6 rounded-xs">
            <h2 className="font-display text-lg text-stone-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-mono">
                3
              </span>
              Order Items ({cart.reduce((s, i) => s + i.qty, 0)})
            </h2>

            <div className="divide-y divide-stone-100">
              {cart.map((item) => {
                const categoryName = typeof item.category === "object" ? item.category?.name : item.category;
                return (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="py-3.5 flex gap-4 items-center">
                    <img
                      src={item.image || item.images?.[0] || "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&q=80"}
                      alt={item.name}
                      className="w-16 h-20 object-cover bg-stone-50 border border-stone-100 flex-none"
                    />
                    <div className="flex-1 min-w-0">
                      {categoryName && (
                        <p className="text-xs text-stone-400 uppercase tracking-widest">{categoryName}</p>
                      )}
                      <p className="text-sm font-semibold text-stone-900 truncate">{item.name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Size: {item.size} · Qty: {item.qty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-900">
                        ₹{(Number(item.price || 0) * (item.qty || 1)).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-stone-400">₹{Number(item.price || 0).toLocaleString()} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-1">
          <div className="bg-stone-50 border border-stone-200 p-6 sticky top-24 rounded-xs">
            <h3 className="font-display text-xl text-stone-900 mb-5">Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium text-stone-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Shipping</span>
                <span className={shipping === 0 ? "text-green-600 font-medium" : "font-medium text-stone-900"}>
                  {shipping === 0 ? "Free" : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated Tax (5%)</span>
                <span className="font-medium text-stone-900">₹{estimatedTax.toFixed(2)}</span>
              </div>
              <div className="border-t border-stone-200 pt-3 flex justify-between font-semibold text-base">
                <span className="text-stone-900">Total Due</span>
                <span className="text-stone-900">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={submittingOrder || addresses.length === 0}
              onClick={handleProceedToPayment}
              className="w-full bg-stone-900 text-white py-3.5 mt-6 text-sm font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:bg-stone-300 disabled:cursor-not-allowed shadow-sm"
            >
              {submittingOrder ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Initiating Payment...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="mt-5 border-t border-stone-200 pt-4 text-xs text-stone-400 space-y-2">
              <div className="flex items-center gap-2 text-stone-600">
                <ShieldCheck size={16} className="text-green-600 flex-none" />
                <span>SSL Encrypted & Safe Checkout</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <CreditCard size={16} className="text-stone-500 flex-none" />
                <span>Instant Payment Verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD NEW ADDRESS */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 shadow-2xl rounded-xs border border-stone-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl text-stone-900 mb-4">Add Shipping Address</h3>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full border border-stone-300 px-3 py-2 text-sm rounded-xs focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full border border-stone-300 px-3 py-2 text-sm rounded-xs focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Country *</label>
                  <input
                    required
                    type="text"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full border border-stone-300 px-3 py-2 text-sm rounded-xs focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Address Line 1 *</label>
                <input
                  required
                  type="text"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="Street address or P.O. Box"
                  className="w-full border border-stone-300 px-3 py-2 text-sm rounded-xs focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  className="w-full border border-stone-300 px-3 py-2 text-sm rounded-xs focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City *</label>
                  <input
                    required
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full border border-stone-300 px-3 py-2 text-sm rounded-xs focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">State *</label>
                  <input
                    required
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="State"
                    className="w-full border border-stone-300 px-3 py-2 text-sm rounded-xs focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Postal Code *</label>
                  <input
                    required
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    placeholder="ZIP"
                    className="w-full border border-stone-300 px-3 py-2 text-sm rounded-xs focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="accent-stone-900"
                />
                <label htmlFor="isDefault" className="text-xs text-stone-700 cursor-pointer">
                  Set as my default shipping address
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-5 py-2 bg-stone-900 text-white text-xs font-semibold hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  {savingAddress ? <Loader2 className="animate-spin" size={14} /> : null}
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYMENT GATEWAY SIMULATION */}
      {paymentModalOpen && currentOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 shadow-2xl rounded-xs border border-stone-200">
            <div className="text-center pb-4 border-b border-stone-100">
              <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <CreditCard size={24} />
              </div>
              <h3 className="font-display text-xl text-stone-900">ShopWave Secure Payment</h3>
              <p className="text-xs text-stone-400 mt-0.5">Order #{currentOrder.orderNumber}</p>
              <p className="text-2xl font-bold text-stone-900 mt-2">
                ₹{Number(currentOrder.totalAmount).toFixed(2)}
              </p>
            </div>

            {paymentError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
                <AlertCircle size={15} className="flex-none text-rose-500" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="mt-5 space-y-3">
              <div className="bg-stone-50 p-3 rounded-xs border border-stone-200/80 text-xs space-y-1 text-stone-600">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-mono uppercase font-semibold text-stone-800">
                    {paymentSession?.provider || "MOCK"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Session ID:</span>
                  <span className="font-mono text-[11px] text-stone-500 truncate max-w-[200px]">
                    {paymentSession?.providerPaymentId}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => handleCompletePayment(false)}
                  className="w-full bg-green-600 text-white py-3 text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 rounded-xs shadow-xs"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Verifying with Bank...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Authorize & Pay ₹{Number(currentOrder.totalAmount).toFixed(2)}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => handleCompletePayment(true)}
                  className="w-full border border-rose-200 text-rose-600 py-2 text-xs font-semibold hover:bg-rose-50 transition-colors"
                >
                  Simulate Declined / Failed Payment
                </button>
              </div>

              <p className="text-[11px] text-stone-400 text-center pt-2">
                Payment is verified server-side. Order status updates upon verified provider confirmation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
