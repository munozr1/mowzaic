import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import NewBookingPage from './pages/NewBookingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { useAuthentication } from './AuthenticationContext';

const Router = () => {
  const { isAuthenticated } = useAuthentication();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route 
        path="/book" 
        element={
          isAuthenticated ? (
            <NewBookingPage />
          ) : (
            <Login />
          )
        } 
      />
    </Routes>
  );
};

export default Router; 
