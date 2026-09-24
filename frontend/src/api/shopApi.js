import { safeFetchWithAuth } from "./authApi.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// PRODUCTS & CATEGORIES API (Public)
// ---------------------------------------------------------------------------
export async function getProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.category && params.category !== "all") query.append("category", params.category);
  if (params.search) query.append("search", params.search);
  if (params.sortBy) query.append("sortBy", params.sortBy);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/products${queryString}`,
    { method: "GET" },
    "Failed to load products."
  );
}

export async function getProductById(idOrSlug) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/products/${encodeURIComponent(idOrSlug)}`,
    { method: "GET" },
    "Failed to load product details."
  );
}

export async function getCategories() {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/categories`,
    { method: "GET" },
    "Failed to load categories."
  );
}

// ---------------------------------------------------------------------------
// ADDRESS API (Protected)
// ---------------------------------------------------------------------------
export async function getAddresses(token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/addresses`,
    {
      method: "GET",
      token,
    },
    "Failed to load delivery addresses."
  );
}

export async function createAddress(data, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/addresses`,
    {
      method: "POST",
      token,
      body: JSON.stringify(data),
    },
    "Failed to add address."
  );
}

export async function updateAddress(id, data, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/addresses/${id}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
    },
    "Failed to update address."
  );
}

export async function deleteAddress(id, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/addresses/${id}`,
    {
      method: "DELETE",
      token,
    },
    "Failed to delete address."
  );
}

export async function setDefaultAddress(id, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/addresses/${id}/default`,
    {
      method: "PATCH",
      token,
    },
    "Failed to set default address."
  );
}

// ---------------------------------------------------------------------------
// CHECKOUT & ORDERS API (Protected)
// ---------------------------------------------------------------------------
export async function checkout(payload, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/checkout`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
    "Failed to create order."
  );
}

export async function getOrders(token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/orders`,
    {
      method: "GET",
      token,
    },
    "Failed to load orders."
  );
}

export async function getOrderById(id, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/orders/${id}`,
    {
      method: "GET",
      token,
    },
    "Failed to load order details."
  );
}

export async function cancelOrder(id, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/orders/${id}/cancel`,
    {
      method: "POST",
      token,
    },
    "Failed to cancel order."
  );
}

// ---------------------------------------------------------------------------
// PAYMENT API (Protected)
// ---------------------------------------------------------------------------
export async function createPayment(orderId, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/payments/create`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ orderId }),
    },
    "Failed to initialize payment session."
  );
}

export async function getPaymentStatus(orderId, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/payments/${orderId}`,
    {
      method: "GET",
      token,
    },
    "Failed to get payment status."
  );
}

export async function verifyPayment(payload, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/payments/verify`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
    "Payment verification failed."
  );
}

export async function failPayment(payload, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/payments/fail`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
    "Failed to update payment status."
  );
}

// ---------------------------------------------------------------------------
// REVIEWS API
// ---------------------------------------------------------------------------
export async function getProductReviews(productId) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/products/${productId}/reviews`,
    {
      method: "GET",
    },
    "Failed to load reviews."
  );
}

export async function createReview(productId, data, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/products/${productId}/reviews`,
    {
      method: "POST",
      token,
      body: JSON.stringify(data),
    },
    "Failed to submit review."
  );
}

export async function deleteReview(id, token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/reviews/${id}`,
    {
      method: "DELETE",
      token,
    },
    "Failed to delete review."
  );
}
