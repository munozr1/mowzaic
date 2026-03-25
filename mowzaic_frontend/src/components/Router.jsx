import { useContext } from 'react';
import PropTypes from 'prop-types';
import { NavigationContext } from '../NavigationContext';
import { useAuthentication } from '../AuthenticationContext';
import LandingPage from '../pages/LandingPage';
import NewBookingPage from '../pages/NewBookingPage';
import MainContent from '../pages/MainContent';
import PageLayout from './NavBar';
import Register from '../pages/Register';
import Account from '../pages/Account';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import FAQ from '../pages/FAQ';
import ProviderRegistrationPage from '../pages/ProviderRegistrationPage';
import ProviderDashboard from '../pages/ProviderDashboard';

const Router = () => {
  const { path } = useContext(NavigationContext);
  const { isAuthenticated, userRole } = useAuthentication();

  // Remove query parameters from path for matching
  const basePath = path.split('?')[0];

  // Provider registration page is always rendered without layout (standalone)
  if (basePath === '/provider' && !isAuthenticated) {
    return <ProviderRegistrationPage />;
  }

  // Render content based on path
  const renderContent = () => {
    // Provider-specific routes
    if (isAuthenticated && userRole === 'provider') {
      switch (basePath) {
        case '/provider/dashboard':
          return <ProviderDashboard />;
        case '/account':
          return <Account />;
        case '/provider':
          return <ProviderDashboard />;
        case '/privacy':
          return <PrivacyPolicy />;
        case '/terms':
          return <TermsOfService />;
        case '/faq':
          return <FAQ />;
        default:
          // Provider lands on any other route -> show dashboard
          return <ProviderDashboard />;
      }
    }

    // Client/default routes
    switch (basePath) {
      case '/':
        return <LandingPage />;
      case '/book':
        return <NewBookingPage />;
      case '/register':
        return <Register />;
      case '/account':
        return <Account />;
      case '/privacy':
        return <PrivacyPolicy />;
      case '/terms':
        return <TermsOfService />;
      case '/faq':
        return <FAQ />;
      default:
        return <MainContent />;
    }
  };

  // Public pages without layout when not authenticated
  const publicPaths = ['/', '/privacy', '/terms', '/faq', '/provider'];
  if (publicPaths.includes(basePath) && !isAuthenticated) {
    return renderContent();
  }

  // For all other routes, wrap with PageLayout
  return (
    <PageLayout>
      {renderContent()}
    </PageLayout>
  );
};

Router.propTypes = {
  children: PropTypes.node
};

export default Router;
