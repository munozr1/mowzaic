import supabase from './db.js';

/**
 * Validates Supabase JWT tokens using Supabase SDK
 * Checks for token in:
 * 1. HTTP-only cookie 'sb-access-token' (from frontend)
 * 2. Authorization header 'Bearer <token>'
 * 
 * Uses Supabase's getUser() method which handles HS256/ES256 verification internally
 */
export const validateToken = async (req, res, next) => {
  // Try to get token from cookie first (frontend sends it here)
  let token = req.cookies?.['sb-access-token'];
  
  // Fallback to Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Access denied, no token provided',
      error: 'missing_token' 
    });
  }

  try {
    // Use Supabase SDK to verify the token - it handles ES256/HS256 automatically
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Token verification failed:', error?.message || 'No user found');
      console.error('Supabase URL:', process.env.SUPABASE_URL);
      console.error('Token (first 20 chars):', token.substring(0, 20) + '...');
      return res.status(401).json({ 
        message: 'Invalid token',
        error: error?.message || 'authentication_failed' 
      });
    }

    // Attach user info to request from Supabase user object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      ...user.user_metadata // Custom metadata (firstName, lastName, etc.)
    };
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    return res.status(401).json({ 
      message: 'Invalid token',
      error: error.message 
    });
  }
};


export const validateUser = async (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;
  if (!email || !password || !firstName || !lastName || !phone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // check if email is already in use
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);
  if (data.length > 0) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  // check if phone is already in use
  const { data: phoneData, error: phoneError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone);
  if (phoneData.length > 0) {
    return res.status(400).json({ message: 'Phone already in use' });
  }

  // check if password is strong
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  // check if password contains at least one uppercase letter, one lowercase letter, and one number 
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
  }

  // check if password contains special characters
  if (!/[!@#$%^&*]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one special character' });
  }

  // check if password contains a space
  if (password.includes(' ')) {
    return res.status(400).json({ message: 'Password cannot contain spaces' });
  }

  // check if password contains a number
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one number' });
  }

  // check if password contains a lowercase letter
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
  }

  // check if password contains an uppercase letter
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
  }

  // check if password contains a special character
  if (!/[!@#$%^&*]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one special character' });
  }
  // check password is not too long
  if (password.length > 72) {
    return res.status(400).json({ message: 'Password must be less than 72 characters' });
  }

  // check if phone is valid
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone must be 10 digits long' });
  }

  next();
};

