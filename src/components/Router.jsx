import { useContext } from 'react';
import PropTypes from 'prop-types';
import { NavigationContext } from '../NavigationContext';
import LandingPage from '../pages/LandingPage';
import NewBookingPage from '../pages/NewBookingPage';
import MainContent from '../pages/MainContent';
import PageLayout from './NavBar';

const Router = () => {
  const { path } = useContext(NavigationContext);

  // Remove query parameters from path for matching
  const basePath = path.split('?')[0];

  // Render content based on path
  const renderContent = () => {
    switch (basePath) {
      case '/':
        return <LandingPage />;
      case '/book':
        return <NewBookingPage />;
      default:
        return <MainContent />;
    }
  };

  // If it's the landing page, render without layout
  if (basePath === '/') {
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
