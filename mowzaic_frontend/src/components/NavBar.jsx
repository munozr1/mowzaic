import { useState, useEffect } from "react";
import { Menu, X, Home, UserCircle, CalendarPlus, LogOut, ChevronRight, LayoutDashboard } from "lucide-react";
import { useNavigation } from "../NavigationContext";
import { useAuthentication } from "../AuthenticationContext";
import { useOrg } from "../OrgContext";
import PropTypes from "prop-types";

const CLIENT_PAGE_TITLES = {
  "/book": "New Booking",
  "/manage": "Manage Properties",
  "/account": "Account",
};

const PROVIDER_PAGE_TITLES = {
  "/provider/dashboard": "Dashboard",
  "/account": "Account",
};

const PageLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, logout, user, userRole } = useAuthentication();
  const { path, navigate } = useNavigation();
  const { orgName } = useOrg();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const isProvider = userRole === 'provider';

  const clientNavigationItems = [
    { icon: CalendarPlus, name: "New Booking", path: "/book" },
    { icon: Home, name: "Properties", path: "/manage" },
    { icon: UserCircle, name: "Account", path: "/account" },
  ];

  const providerNavigationItems = [
    { icon: LayoutDashboard, name: "Dashboard", path: "/provider/dashboard" },
    { icon: UserCircle, name: "Account", path: "/account" },
  ];

  const navigationItems = isProvider ? providerNavigationItems : clientNavigationItems;
  const pageTitles = isProvider ? PROVIDER_PAGE_TITLES : CLIENT_PAGE_TITLES;

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  const pageTitle = pageTitles[path] || "Dashboard";
  const userInitial = user?.email ? user.email[0].toUpperCase() : "U";
  const defaultPath = isProvider ? "/provider/dashboard" : "/book";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-gray-200">
          <button
            onClick={() => navigate(defaultPath)}
            className="text-lg font-bold tracking-tight text-gray-900 hover:opacity-80 transition-opacity"
          >
            {orgName}
          </button>
          {isProvider && (
            <span className="text-xs font-medium text-[var(--color-primary-dark)] bg-[var(--color-bg)] px-2 py-0.5 rounded-full">
              provider
            </span>
          )}
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navigationItems.map((item) => {
            const isActive = path === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setIsOpen(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-bg)] text-[var(--color-primary-dark)]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2 : 1.75}
                  className={
                    isActive
                      ? "text-[var(--color-primary)]"
                      : "text-gray-400 group-hover:text-gray-600"
                  }
                />
                {item.name}
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-[var(--color-primary)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-sm font-semibold text-[var(--color-primary-dark)]">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 md:px-6">
          {isMobile && (
            <button
              onClick={() => setIsOpen(true)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
            >
              <Menu size={20} />
            </button>
          )}
          <h1 className="text-base font-semibold text-gray-900">{pageTitle}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageLayout;
