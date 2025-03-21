import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";

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
  const [token, setToken] = useState(() => {
    // Initialize token from localStorage if available
    return localStorage.getItem('token') || null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL;

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${apiUrl}/refresh`, {
        method: 'POST',
        credentials: 'include', // Important: needed to send cookies
      });
      
      if (!response.ok) throw new Error('Refresh failed');
      
      const data = await response.json();
      setToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const ping = async (jwtToken) => {
    try {
      const res = await fetch(`${apiUrl}/ping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        credentials: 'include'
      });

      if (res.status === 401) {
        // Token expired, try to refresh
        const newToken = await refreshAccessToken();
        // Retry the ping with new token
        return ping(newToken);
      }

      if (res.ok) {
        return await res.json();
      }
      return res;
    } catch (error) {
      console.error("Ping error:", error);
      return { ok: false };
    }
  }

  useEffect(() => {
    const checkAuthentication = async () => {
      const stored_token = localStorage.getItem('token');
      if (!stored_token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        setToken(stored_token);
        const response = await ping(stored_token);
        
        if (response.ok !== false) {
          setIsAuthenticated(true);
          const userData = jwtDecode(stored_token);
          setUser(userData);
        } else {
          setToken(null);
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Authentication check error:", error);
        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      }
    };

    checkAuthentication();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
          
          
  useEffect(() => {
    const url = import.meta.env.VITE_API_URL;
    if (token) {
      //console.log("token changed", token);
      // Store token in localStorage whenever it changes
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      const user = jwtDecode(token);
      //console.log(user);
      setUser(user);
      const fetchAddresses = async ()=>{
        const res = await fetch(`${url}/properties`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({userId: user.id})
        });
        setAddresses(await res.json());
      }
      fetchAddresses();
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);
  
  const login = async (email, password) => {
    //console.log(email, password);
    let res = await fetch(`${apiUrl}/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    let data = await res.json();
    if (res.ok) {
      setToken(data.accessToken);
    } else {
      throw new Error(data.message);
    }
  }

  const logout = () => {
    setUser(null);
    setToken(null);
    // Clear token from localStorage on logout
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
      addresses,
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
