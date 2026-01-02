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

const Router = () => {
  const { path } = useContext(NavigationContext);
  const { isAuthenticated } = useAuthentication();


  // if (!isAuthenticated) {
  //   return <Login />;
  // }
  // Remove query parameters from path for matching
  const basePath = path.split('?')[0];

  // Render content based on path
  const renderContent = () => {
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
      default:
        return <MainContent />;
    }
  };

  // If it's the landing page and not authenticated, render without layout
  if ((basePath === '/' || basePath === '/privacy' || basePath === '/terms') && !isAuthenticated) {
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
