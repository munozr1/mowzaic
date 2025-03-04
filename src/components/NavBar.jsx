import { useState, useEffect } from "react";
import { Menu, X, Home, UserCircle, Newspaper } from "lucide-react";
import { useNavigation } from "../NavigationContext";
import { useAuthentication } from "../AuthenticationContext";
import PropTypes from "prop-types";


const PageLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const {isAuthenticated, logout} = useAuthentication();
  const {path, navigate} = useNavigation()

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);


  const navigationItems = [
    { icon: Newspaper, name: "New Booking", path: "/book" },
    { icon: Home, name: "Manage Properites", path: "/manage" },
    { icon: UserCircle, name: "Account", path: "/" },
  ];

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div
        className={
          `fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out md:static md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`
        }
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <h2 className="text-xl font-bold text-[#2EB966]">mowzaic</h2>
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 md:hidden"
            >
              <X size={24} />
            </button>
          )}
        </div>
        
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigationItems.map((item) => {
            const isActive = path === item.path;
            
            return (
              <a
                key={item.name}
                onClick={() => navigate(item.path)}
                className={
                  `hover:cursor-pointer flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors
                  ${isActive? "bg-[#2EB966] text-white": "text-gray-600 hover:bg-gray-100"}`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center bg-white shadow-sm">
          {isMobile && (
            <button
              onClick={() => setIsOpen(true)}
              className="p-4 text-gray-500 hover:text-gray-700 md:hidden"
            >
              <Menu size={24} />
            </button>
          )}
          
          <div className="flex flex-1 items-center justify-center">
          </div>
          
          <div className="px-4">
            {
              !isAuthenticated ?
              <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-700 hover:text-[#2EB966]">
              login
            </button>
            :
            <button onClick={logout} className="text-sm font-medium text-gray-700 hover:text-[#2EB966]">
              logout
            </button>
            }
          </div>
        </header>

        {/* Page Content */}
        <main className="p-0 md:p-0">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};


PageLayout.propTypes = {
	children: PropTypes.node.isRequired,
}



export default PageLayout;
