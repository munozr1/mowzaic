import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const LoginModalContext = createContext(null);

export const useLoginModal = () => {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error('useLoginModal must be used within a LoginModalProvider');
  }
  return context;
};

export const LoginModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  const openLoginModal = () => {
    setMode('login');
    setIsOpen(true);
  };
  
  const openRegisterModal = () => {
    setMode('register');
    setIsOpen(true);
  };
  
  const closeLoginModal = () => setIsOpen(false);
  
  const switchMode = (newMode) => setMode(newMode);

  return (
    <LoginModalContext.Provider value={{ 
      isOpen, 
      mode,
      openLoginModal, 
      openRegisterModal,
      closeLoginModal,
      switchMode
    }}>
      {children}
    </LoginModalContext.Provider>
  );
};

LoginModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default LoginModalContext;
