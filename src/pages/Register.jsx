import { useLoginModal } from '../LoginModalContext';
import { useNavigation } from '../NavigationContext';

const Register = () => {
  const { openRegisterModal } = useLoginModal();
  const { navigate } = useNavigation();
  
  // Redirect to register modal when this page loads
  openRegisterModal();
  navigate('/');
  
  return null;
};

export default Register; 
