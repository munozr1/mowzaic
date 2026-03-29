import { createContext, useContext, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, BACKEND_URL } from "./constants";
import { useOrg } from "./OrgContext";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [userRole, setUserRole] = useState(null);
  // In-memory refresh token — not persisted to storage
  const refreshTokenRef = useRef(null);
  const { orgId } = useOrg();

  // Check if user profile is complete and fetch role
  const checkProfileCompletion = async (userId) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, phone, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking profile:', error);
      return;
    }

    // Profile is incomplete if any required field is missing or empty
    const isIncomplete = !data?.first_name || !data?.last_name || !data?.phone;
    setNeedsProfileCompletion(isIncomplete);
    setUserRole(data?.role || 'user');
  };

  // Set authenticated state from backend response
  const setAuthState = async ({ user: u, access_token, refresh_token }) => {
    refreshTokenRef.current = refresh_token;

    // Set session in Supabase client so RLS works
    await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    setSession({ access_token, user: u });
    setUser(u);
    setIsAuthenticated(true);
    if (u) checkProfileCompletion(u.id);
  };

  const clearAuthState = async () => {
    refreshTokenRef.current = null;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAuthenticated(false);
    setNeedsProfileCompletion(false);
    setUserRole(null);
  };

  const refreshSession = async () => {
    const rt = refreshTokenRef.current;
    if (!rt) {
      await clearAuthState();
      return null;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });

      if (!res.ok) {
        await clearAuthState();
        return null;
      }

      const data = await res.json();
      await setAuthState(data);
      return data;
    } catch (error) {
      console.error('Session refresh failed', error);
      await clearAuthState();
      return null;
    }
  };

  useEffect(() => {
    // Handle OAuth callback — extract tokens from URL hash
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      if (access_token && refresh_token) {
        try {
          // Validate tokens via backend
          const res = await fetch(`${BACKEND_URL}/auth/set-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token, refresh_token }),
          });

          if (!res.ok) {
            throw new Error('Failed to validate session');
          }

          const data = await res.json();
          // set-session returns { user, access_token, refresh_token }
          await setAuthState({ ...data, refresh_token });

          // Clear hash from URL
          window.history.replaceState(null, '', window.location.pathname + window.location.search);

          // Google OAuth doesn't support custom metadata like signUp does,
          // so if this callback landed on a /provider path, set role to 'provider'
          // Also set org_id for OAuth users (not set via handle_new_user trigger)
          if (data.user) {
            const updates = {};
            if (window.location.pathname.startsWith('/provider')) {
              updates.role = 'provider';
            }
            if (orgId) {
              updates.org_id = orgId;
            }
            if (Object.keys(updates).length > 0) {
              const { error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', data.user.id);
              if (!updateError && updates.role) {
                setUserRole(updates.role);
              }
            }
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          setLoading(false);
        }
        return true;
      }
      return false;
    };

    // Try OAuth callback first
    handleOAuthCallback().then((wasOAuthCallback) => {
      if (!wasOAuthCallback) {
        // No tokens in URL and no refresh token in memory — not logged in
        // (In-memory tokens are lost on page refresh — this is expected)
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    // Refresh interval — rotate tokens every 45 minutes
    const interval = setInterval(() => {
      if (refreshTokenRef.current) {
        refreshSession().catch(console.error);
      }
    }, 45 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Login failed');

    await setAuthState(data);
    return data;
  };

  const signInWithGoogle = async (returnUrl) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectTo = returnUrl ? `${baseUrl}${returnUrl}` : `${baseUrl}/book`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    });

    if (error) throw error;
    return data;
  };

  const register = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ...metadata, org_id: orgId },
      },
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    try {
      const token = session?.access_token;
      if (token) {
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (e) {
      console.error(e);
    }
    await clearAuthState();
  };


  const value = {
    user,
    session,
    token: session?.access_token ?? null,
    isAuthenticated,
    loading,
    needsProfileCompletion,
    checkProfileCompletion,
    userRole,
    login,
    signInWithGoogle,
    register,
    logout,
    supabase,
  };

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};

AuthenticationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Export the context separately
export { AuthenticationContext };
