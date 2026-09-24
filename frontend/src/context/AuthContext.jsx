import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authApi from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Short-lived access token kept in memory only
  const [loading, setLoading] = useState(true);

  // Helper to fetch current user profile with an access token
  const fetchCurrentUser = useCallback(async (accessToken) => {
    try {
      const activeToken = accessToken || token;
      const data = await authApi.getCurrentUser(activeToken);
      const profile = data?.user || data;
      setUser(profile);
      return profile;
    } catch (err) {
      console.warn("Could not fetch current user:", err.message);
      return null;
    }
  }, []);

  // Attempt to restore session on page load using HttpOnly refresh token
  const refreshAuthentication = useCallback(async () => {
    try {
      const data = await authApi.refreshToken();
      const newAccessToken = data?.accessToken || data?.token;
      if (newAccessToken) {
        setToken(newAccessToken);
      }
      if (data?.user) {
        setUser(data.user);
        return data.user;
      } else if (newAccessToken) {
        return await fetchCurrentUser(newAccessToken);
      }
      return null;
    } catch (err) {
      // Session expired or no valid refresh token cookie
      setUser(null);
      setToken(null);
      return null;
    }
  }, []);

  // Subscribe to central token / user changes from authApi
  useEffect(() => {
    const unsubscribe = authApi.subscribeAuthChange((newToken, newUser) => {
      setToken(newToken);
      if (newUser !== undefined) {
        setUser(newUser);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Initial load check
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await refreshAuthentication();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshAuthentication]);

  // Customer Login
  const login = async ({ email, password }) => {
    const data = await authApi.loginUser({ email, password });
    const accessToken = data?.accessToken || data?.token;
    if (accessToken) {
      setToken(accessToken);
    }
    const customer = data?.user || (await fetchCurrentUser(accessToken));
    setUser(customer);
    return data;
  };

  // Customer Registration
  const register = async ({ name, email, password }) => {
    const data = await authApi.registerUser({ name, email, password });
    // If backend returns immediate authentication credentials
    const accessToken = data?.accessToken || data?.token;
    if (accessToken) {
      setToken(accessToken);
    }
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  };

  // Customer Logout
  const logout = async () => {
    try {
      await authApi.logoutUser();
    } catch (err) {
      console.warn("Logout API error:", err.message);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
    refreshAuthentication,
    fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
