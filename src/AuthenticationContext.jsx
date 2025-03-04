import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";
export const AuthenticationContext = createContext();

export const AuthenticationProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
      const user = jwtDecode(token);
      console.log(user);
      setUser(user);
      const fetchAddresses = async ()=>{
        const res = await fetch("http://localhost:3000/properties", {
          method: "POST",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({userId: user.id})
        });
        setAddresses(await res.json());
      }
      fetchAddresses();
    } else {
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
    console.log(email, password);
    let res = await fetch("http://localhost:3000/login", {
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
    window.location.href = '/';
  }

  
  return (
    <AuthenticationContext.Provider value={{user, token, login, logout, isAuthenticated, addresses}}>
      {children}
    </AuthenticationContext.Provider>
  );
};

AuthenticationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Hook to use the authentication
export const useAuthentication = () => useContext(AuthenticationContext);
