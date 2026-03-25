import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants";

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

  // Configure Supabase client for in-memory storage only
  useEffect(() => {
    supabase.auth.setSession = (session) => {
      // No-op for persistence, handled by state
      return Promise.resolve();
    }
  }, []);

  // Check if user profile is complete
  const checkProfileCompletion = async (userId) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, phone')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking profile:', error);
      return;
    }

    // Profile is incomplete if any required field is missing or empty
    const isIncomplete = !data?.first_name || !data?.last_name || !data?.phone;
    setNeedsProfileCompletion(isIncomplete);
  };

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth/token');
      if (res.status === 401) {
        // Expected when not logged in
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        return null; // Return null instead of throwing
      }
      if (!res.ok) throw new Error('Failed to refresh session');

      const data = await res.json();
      const { user, access_token, expires_in } = data;

      const newSession = {
        access_token,
        user,
        expires_in
      };

      // Manually set the session in Supabase client memory so RLS works
      await supabase.auth.setSession({
        access_token,
        refresh_token: 'dummy', // Not used client-side anymore
      });

      setSession(newSession);
      setUser(user);
      setIsAuthenticated(true);
      if (user) checkProfileCompletion(user.id);

      return newSession;
    } catch (error) {
      console.error('Session refresh failed', error);
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  useEffect(() => {
    // Handle OAuth callback - extract tokens from URL hash and set cookies
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      if (access_token && refresh_token) {
        try {
          // Send tokens to serverless function to set HTTP-only cookies
          const res = await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token, refresh_token }),
          });

          if (!res.ok) {
            throw new Error('Failed to set session cookies');
          }

          // Clear hash from URL
          window.history.replaceState(null, '', window.location.pathname);

          // Refresh session to load user state
          await refreshSession();
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
        // Normal session load if not OAuth callback
        refreshSession().catch(() => {
          setLoading(false);
        }).finally(() => setLoading(false));
      }
    });

    // Refresher interval (refresh every 30 mins or somewhat before expiry)
    // Access tokens usually last 1 hour.
    const interval = setInterval(() => {
      if (isAuthenticated) {
        refreshSession().catch(console.error);
      }
    }, 45 * 60 * 1000); // 45 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    const { user, access_token } = data;

    // Set in-memory for Supabase client
    await supabase.auth.setSession({
      access_token,
      refresh_token: 'dummy',
    });

    setSession({ access_token, user });
    setUser(user);
    setIsAuthenticated(true);
    checkProfileCompletion(user.id);
    return data;
  };

  const signInWithGoogle = async (returnUrl) => {
    // Allows OAuth to flow as normal, but we need to handle the callback 
    // to exchange the hash for cookies. This is tricky with pure client-side + cookie split.
    // For now, let's keep the user flow:
    // 1. Supabase OAuth redirects back to app.
    // 2. App sees hash, calls supabase.auth.getSession() (client side exchange).
    // 3. We typically need to intercept this token and send it to an endpoint to set the cookie.

    // SIMPLE APPROACH:
    // Let Supabase handle the redirect. The client will get a session in URL hash.
    // We need a way to 'upgrade' that to our cookie system.
    // For this migration, I will implement a 'sync' method if we detect a session from URL.

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
    // Registration still happens client side? Or needs proxy?
    // If we want auto-login after register, we might need proxy or handling.
    // Supabase usually signs in after signUp if email confirm is off.

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    // If we got a session immediately (email confirm off), we should sync it to cookies.
    // Ideally we would move register to backend too, but for scope let's manually login after register if needed
    // or just let them login manually.

    return data;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    await supabase.auth.signOut(); // Clear client state
    setSession(null);
    setUser(null);
    setIsAuthenticated(false);
    setNeedsProfileCompletion(false);
  };


  const value = {
    user,
    session,
    token: session?.access_token ?? null,
    isAuthenticated,
    loading,
    needsProfileCompletion,
    checkProfileCompletion,
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
