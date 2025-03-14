import { useContext } from 'react';
import PropTypes from 'prop-types';
import { NavigationContext } from '../NavigationContext';
import { useAuthentication } from '../AuthenticationContext';
import LandingPage from '../pages/LandingPage';
import NewBookingPage from '../pages/NewBookingPage';
import MainContent from '../pages/MainContent';
import PageLayout from './NavBar';
import Login from '../pages/Login';
import Register from '../pages/Register';
const Router = () => {
  const { path } = useContext(NavigationContext);
  const { isAuthenticated } = useAuthentication();

  // Remove query parameters from path for matching
  const basePath = path.split('?')[0];

  // Render content based on path
  const renderContent = () => {
    switch (basePath) {
      case '/':
        return <LandingPage />;
      case '/login':
        return <Login />;
      case '/book':
        return <NewBookingPage />;
      case '/register':
        return <Register />;
      default:
        return <MainContent />;
    }
  };

  // If it's the landing page or login page and not authenticated, render without layout
  if ((basePath === '/' || basePath === '/login') && !isAuthenticated) {
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
