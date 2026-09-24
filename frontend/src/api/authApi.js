const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let activeAccessToken = null;
const authListeners = new Set();
let inFlightRefreshPromise = null;

export function getAccessToken() {
  return activeAccessToken;
}

export function setAccessToken(token) {
  activeAccessToken = token || null;
}

export function subscribeAuthChange(callback) {
  authListeners.add(callback);
  return () => {
    authListeners.delete(callback);
  };
}

function notifyAuthSubscribers(token, user) {
  for (const listener of authListeners) {
    try {
      listener(token, user);
    } catch (e) {
      console.warn("Auth subscriber error:", e);
    }
  }
}

/**
 * Helper to handle fetch responses and map errors to customer-friendly messages.
 */
export async function handleResponse(response, defaultErrorMessage) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Response had no JSON body
  }

  if (!response.ok) {
    let message = data?.message || defaultErrorMessage;

    // Sanitize and translate common server messages to clean customer-facing text
    if (response.status === 401 || response.status === 400) {
      const lower = String(message).toLowerCase();
      if (lower.includes("invalid") || lower.includes("incorrect") || lower.includes("password") || lower.includes("credential")) {
        message = "Email or password is incorrect.";
      } else if (lower.includes("exist") || lower.includes("already") || lower.includes("duplicate") || lower.includes("email")) {
        message = "An account with this email already exists.";
      }
    } else if (response.status === 409) {
      message = "An account with this email already exists.";
    } else if (response.status >= 500) {
      message = "We couldn't connect to ShopWave. Please try again.";
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Centralized token refresh function with in-flight deduplication.
 */
export async function performTokenRefresh() {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setAccessToken(null);
        notifyAuthSubscribers(null, null);
        const err = new Error("Session expired. Please sign in again.");
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const newAccessToken = data?.accessToken || data?.data?.accessToken || data?.token;
      const user = data?.user || data?.data?.user;

      if (newAccessToken) {
        setAccessToken(newAccessToken);
        notifyAuthSubscribers(newAccessToken, user);
      }
      return newAccessToken;
    } catch (err) {
      setAccessToken(null);
      notifyAuthSubscribers(null, null);
      throw err;
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}

/**
 * Robust fetch wrapper with network resilience, HttpOnly credentials, and automatic 401 refresh & retry.
 */
export async function safeFetchWithAuth(url, options = {}, defaultErrorMessage = "Something went wrong. Please try again.", isRetry = false) {
  try {
    const currentToken = options.token || getAccessToken();
    const headers = {
      "Content-Type": "application/json",
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
    });

    // Check if access token is invalid/expired and attempt single automatic refresh & retry
    const isAuthEndpoint =
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register");

    if (response.status === 401 && !isRetry && !isAuthEndpoint) {
      try {
        const newAccessToken = await performTokenRefresh();
        if (newAccessToken) {
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          const retryResponse = await fetch(url, {
            ...options,
            credentials: "include",
            headers: retryHeaders,
          });
          return await handleResponse(retryResponse, defaultErrorMessage);
        }
      } catch (refreshErr) {
        // Refresh failed; propagate original 401 response handling
      }
    }

    return await handleResponse(response, defaultErrorMessage);
  } catch (err) {
    if (err.name === "TypeError" || !err.status) {
      throw new Error("We couldn't connect to ShopWave. Please try again.");
    }
    throw err;
  }
}

/**
 * Register a new customer
 * POST /api/auth/register
 */
export async function registerUser({ name, email, password }) {
  const data = await safeFetchWithAuth(
    `${API_BASE_URL}/api/auth/register`,
    {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    },
    "Unable to create account. Please check your details."
  );
  const token = data?.accessToken || data?.data?.accessToken || data?.token;
  if (token) {
    setAccessToken(token);
    notifyAuthSubscribers(token, data?.user || data?.data?.user);
  }
  return data;
}

/**
 * Sign in existing customer
 * POST /api/auth/login
 */
export async function loginUser({ email, password }) {
  const data = await safeFetchWithAuth(
    `${API_BASE_URL}/api/auth/login`,
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    "Email or password is incorrect."
  );
  const token = data?.accessToken || data?.data?.accessToken || data?.token;
  if (token) {
    setAccessToken(token);
    notifyAuthSubscribers(token, data?.user || data?.data?.user);
  }
  return data;
}

/**
 * Refresh access token using rotating HttpOnly refresh token
 * POST /api/auth/refresh
 */
export async function refreshToken() {
  return performTokenRefresh();
}

/**
 * Sign out customer (revokes refresh token and clears cookie)
 * POST /api/auth/logout
 */
export async function logoutUser() {
  try {
    return await safeFetchWithAuth(
      `${API_BASE_URL}/api/auth/logout`,
      {
        method: "POST",
      },
      "Unable to complete sign out."
    );
  } finally {
    setAccessToken(null);
    notifyAuthSubscribers(null, null);
  }
}

/**
 * Fetch current authenticated user profile
 * GET /api/auth/me
 */
export async function getCurrentUser(token) {
  return safeFetchWithAuth(
    `${API_BASE_URL}/api/auth/me`,
    {
      method: "GET",
      token,
    },
    "Unable to load profile."
  );
}
