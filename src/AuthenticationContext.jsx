import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";
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


  const checkToken = async (currentToken) => {
    try {
      let decoded = jwtDecode(currentToken);

      if (decoded.exp < Date.now() / 1000) {
        const newToken = await refreshAccessToken();
        if (!newToken) throw new Error("Token refresh failed");
        decoded = jwtDecode(newToken);
        setToken(newToken);
      }

      setUser(decoded);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Token check failed:", err);
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    if (token) {
      checkToken(token);
    } else {
      // try refresh on initial load
      (async () => {
        const newToken = await refreshAccessToken();
        if (newToken) {
          setToken(newToken);
        }
      })();
    }
  }, [token]);


  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/refresh`, {
        method: "POST",
        credentials: "include", // Needed to send cookies
      });

      if (!response.ok) {
        throw new Error("Refresh failed");
      }

      const data = await response.json();
      const newToken = data.accessToken;

      return newToken;
    } catch (error) {
      console.error("Refresh token error:", error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);
  
  const login = async (email, password) => {
    let res = await fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
    });
    let data = await res.json();
    if (res.ok) {
      setToken(data.accessToken);
    } else {
      throw new Error(data.message);
    }
  }

  const logout = async () => {
    setUser(null);
    setToken(null);
    // Clear token from localStorage on logout
    await fetch(`${BACKEND_URL}/logout`, {
      method: "POST",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  
  return (
    <AuthenticationContext.Provider value={{
      user, 
      token, 
      login, 
      logout, 
      isAuthenticated, 
      refreshAccessToken
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
