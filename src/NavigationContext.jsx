import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);

  // Function to navigate
  const navigate = (newPath) => {
    window.history.pushState({}, "", newPath);
    setPath(newPath);
  };

  // Listen for browser back/forward navigation
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
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

