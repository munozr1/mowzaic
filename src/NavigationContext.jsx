import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

export const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname + window.location.search);

  // Function to navigate
  const navigate = (newPath, queryParams = {}) => {
    const searchParams = new URLSearchParams(queryParams).toString();
    const fullPath = searchParams ? `${newPath}?${searchParams}` : newPath;
    
    window.history.pushState({}, "", fullPath);
    setPath(fullPath);
  };

  // Listen for browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname + window.location.search);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <NavigationContext.Provider value={{ path, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

NavigationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Hook to use the navigation
export const useNavigation = () => useContext(NavigationContext);
