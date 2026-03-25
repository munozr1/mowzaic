import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import supabase from './db.js';
import { validateToken, validateUser } from './middleware.js';
import logger from './logger.js';
import { 
  createSupabaseClientWithAuth,
  asyncHandler, 
  ValidationError, 
  AuthenticationError, 
  DatabaseError 
} from './utils.js';

const router = express.Router();

const ACCESS_TOKEN_EXPIRY = '10m';
const REFRESH_TOKEN_EXPIRY = '7d';

// ==========================================
// DEPRECATED: Custom JWT Authentication
// ==========================================
// These endpoints generate custom HS256 JWTs.
// Frontend now uses Supabase authentication with ES256 tokens.
// These routes are kept for backward compatibility but should not be used.
// Use Supabase Auth (Vercel serverless functions) instead.
// ==========================================

//New users
router.post('/register', validateUser, asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone } = req.body;

    //input validation
    if (!email || !password || !firstName || !lastName || !phone) {
      throw new ValidationError('Missing required fields');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await supabase
      .from('users')
      .insert({ 
        email, 
        password: hashedPassword, 
        role: 'authenticated', 
        first_name: firstName, 
        last_name: lastName, 
        phone 
      })
      .select('id, email, role')
      .single();

    if (result.error) {
      throw new DatabaseError('Error creating user');
    }

    res.status(201).json({ 
      message: 'User created successfully', 
      user: result.data 
    });
}));

router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    //input validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      throw new DatabaseError('Error fetching user');
    }

    logger.info('User login attempt:', { email: user?.email });
    logger.info('User:', { user });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: 'authenticated', 
        first_name: user.first_name, 
        last_name: user.last_name, 
        phone: user.phone
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.MODE === 'production',
      sameSite: 'Strict',
    });

    logger.info('Login successful:', { accessToken });

    res.json({ message: 'Login successful', accessToken });
}));

// Refresh Access Token
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  logger.info('Refresh token received:', { refreshToken });
  if (!refreshToken) {
    throw new AuthenticationError('No refresh token provided');
  }

  // Check if refresh token is blocked (Existing Logic - Good)
  const { data: tokenBlocklist, error: blocklistError } = await supabase
    .from('token_blocklist')
    .select('*')
    .eq('token', refreshToken);

  if (blocklistError) {
    throw new DatabaseError('Error checking token blocklist');
  }

  if (tokenBlocklist.length > 0) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Use a proper try/catch with Promise instead of a raw Promise constructor
  try {
    const userPayload = await new Promise((resolve, reject) => {
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
          return reject(new AuthenticationError('Invalid refresh token'));
        }
        resolve(user);
      });
    });

    // 1. Fetch the user details using the ID from the decoded refresh token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone') // Select only the necessary fields
      .eq('id', userPayload.id)
      .single();

    if (userError || !user) {
      // Consider invalidating the refresh token if the user is not found
      throw new AuthenticationError('User not found or database error during refresh');
    }

    // 2. Generate the new access token with the COMPLETE user data payload
    const newAccessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        //role: user.role, // Use the correct role from the DB
        role: 'authenticated', //TODO: unhardcode this maybe
        first_name: user.first_name, 
        last_name: user.last_name, 
        phone: user.phone
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    // Re-throw the error to be caught by your asyncHandler error handling middleware
    throw err; 
  }
}));

router.post('/logout', asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AuthenticationError('No refresh token found');
    }

    const { error } = await supabase
      .from('token_blocklist')
      .insert({ token: refreshToken });

    if (error) {
      throw new DatabaseError('Error adding token to blocklist');
    }

    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'Strict' });
    res.json({ message: 'Logged out' });
}));

router.post('/ping', validateToken, (req, res) => {
  res.status(200).json({ 
    message: 'pong',
    user: req.user 
  });
});

router.post('/update-user', validateToken, asyncHandler(async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  const { id } = req.user;

  if (!first_name || !last_name || !phone) {
    throw new ValidationError('Missing required fields');
  }

  const { data, error } = await supabase
    .from('users')
    .update({ first_name, last_name, phone })
    .eq('id', id)
    .select('id, email, role, first_name, last_name, phone')
    .single();

  if (error) {
    throw new DatabaseError('Failed to update user');
  }

  res.status(200).json({ 
    message: 'User updated successfully', 
    user: data 
  });
}));

router.get('/protected', validateToken, (req, res) => {
  res.json({ 
    message: 'This is a protected route', 
    user: req.user 
  });
});

router.get('/user/:id', validateToken, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed authorization header');
  }

  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single();  

  if (error) {
    throw new DatabaseError(`Failed to fetch user: ${error.message}`);
  }

  res.json(data);
}));

export { router as authRoutes };

