import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { BACKEND_URL } from "./constants";
// Create context outside of the provider component
const AuthenticationContext = createContext(null);

// Separate hook for using the context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuthentication = () => {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error('useAuthentication must be used within an AuthenticationProvider');
  }
  return context;
};

// Provider component
export const AuthenticationProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const refreshTimer = useRef(null);

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  // Minimal JWT decode helper (only decodes payload; does not verify signature)
  const decodeJwt = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let payload = parts[1];
      // base64url -> base64
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      // pad with '='
      const pad = payload.length % 4;
      if (pad) payload += '='.repeat(4 - pad);
      const decoded = atob(payload);
      // decode percent-encoded utf-8
      const json = decodeURIComponent(
        decoded.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(json);
    } catch (err) {
      console.error('Failed to decode jwt:', err);
      return null;
    }
  };
  // keep the actual refresh function in a ref so scheduled timeouts call a stable reference
  const refreshAccessTokenRef = useRef(null);

  const scheduleRefresh = useCallback((accessToken) => {
    clearRefreshTimer();
    if (!accessToken) return;
    try {
      const decoded = decodeJwt(accessToken);
      const now = Date.now() / 1000;
      const msUntilExpiry = (decoded.exp - now) * 1000;
      // refresh 60 seconds before expiry
      const refreshIn = Math.max(msUntilExpiry - 60_000, 0);
      refreshTimer.current = setTimeout(() => {
        if (refreshAccessTokenRef.current) refreshAccessTokenRef.current();
      }, refreshIn);
    } catch (err) {
      console.error("Failed to schedule token refresh:", err);
    }
  }, []);

  const setAuthFromToken = useCallback((accessToken) => {
    if (!accessToken) {
      clearRefreshTimer();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    try {
      const decoded = decodeJwt(accessToken);
      setToken(accessToken);
      setUser(decoded);
      setIsAuthenticated(true);
      scheduleRefresh(accessToken);
    } catch (err) {
      console.error("Invalid access token:", err);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [scheduleRefresh]);

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Refresh failed");
      const data = await response.json();
      const newToken = data?.accessToken || null;
      if (newToken) setAuthFromToken(newToken);
      return newToken;
    } catch (err) {
      console.error("Refresh token error:", err);
      setAuthFromToken(null);
      return null;
    }
  };

  // expose the refresh function through the ref so scheduled timers call the latest function
  refreshAccessTokenRef.current = refreshAccessToken;

  useEffect(() => {
    // on mount try a single refresh (server-side refresh cookie expected)
    (async () => {
      if (refreshAccessTokenRef.current) await refreshAccessTokenRef.current();
    })();
    return () => clearRefreshTimer();
    // run only once on mount
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const login = async (email, password) => {
    const res = await fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    if (data?.accessToken) setAuthFromToken(data.accessToken);
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : undefined },
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearRefreshTimer();
      setAuthFromToken(null);
      window.location.href = "/";
    }
  };

  return (
    <AuthenticationContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated,
      refreshAccessToken,
    }}>
      {children}
    </AuthenticationContext.Provider>
  );
};

AuthenticationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Export the context separately
export { AuthenticationContext };
