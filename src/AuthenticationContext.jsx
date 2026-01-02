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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setLoading(false);
      
      if (session?.user) {
        checkProfileCompletion(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setLoading(false);
      
      if (session?.user) {
        checkProfileCompletion(session.user.id);
      } else {
        setNeedsProfileCompletion(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async (returnUrl) => {
    // Build redirect URL with query params if provided
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectTo = returnUrl ? `${baseUrl}${returnUrl}` : `${baseUrl}/book`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
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
        data: metadata,
      },
    });
    
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
