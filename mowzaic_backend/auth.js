import express from 'express';
import supabase, { supabaseAdmin } from './db.js';
import { validateToken } from './middleware.js';
import logger from './logger.js';
import {
  createSupabaseClientWithAuth,
  asyncHandler,
  ValidationError,
  AuthenticationError,
  DatabaseError
} from './utils.js';

const router = express.Router();

// ==========================================
// Supabase Authentication Endpoints
// ==========================================
// Pure Bearer token auth — no cookies.
// Access + refresh tokens are returned in JSON responses.
// Frontend stores them in memory.
// ==========================================

// Login with email/password
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logger.warn('Login failed:', { email, error: error.message });
    throw new AuthenticationError(error.message);
  }

  const { session, user } = data;

  logger.info('Login successful:', { email: user.email });

  res.json({
    user,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
  });
}));

// Refresh session using refresh_token in body
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new AuthenticationError('No refresh token provided');
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token,
  });

  if (error) {
    logger.warn('Token refresh failed:', { error: error.message });
    throw new AuthenticationError('Invalid refresh token');
  }

  const { session, user } = data;

  res.json({
    user,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
  });
}));

// Validate OAuth callback tokens
router.post('/set-session', asyncHandler(async (req, res) => {
  const { access_token, refresh_token } = req.body;

  if (!access_token || !refresh_token) {
    throw new ValidationError('access_token and refresh_token are required');
  }

  // Validate the access token by fetching the user
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);

  if (error || !user) {
    logger.warn('set-session validation failed:', { error: error?.message });
    throw new AuthenticationError('Invalid tokens');
  }

  res.json({
    user,
    access_token,
    refresh_token,
  });
}));

// Logout — revoke session server-side
router.post('/logout', validateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { error } = await supabaseAdmin.auth.admin.signOut(userId);

  if (error) {
    logger.warn('Logout error:', { userId, error: error.message });
    // Don't throw — still clear client state
  }

  res.json({ message: 'Logged out' });
}));

// Health check for auth
router.post('/ping', validateToken, (req, res) => {
  res.status(200).json({
    message: 'pong',
    user: req.user
  });
});

// Update user profile
router.post('/update-user', validateToken, asyncHandler(async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  const { id } = req.user;

  if (!first_name || !last_name || !phone) {
    throw new ValidationError('Missing required fields');
  }

  // Use authenticated client so RLS is enforced
  const authHeader = req.headers.authorization;
  const jwt = authHeader.split(' ')[1];
  const client = createSupabaseClientWithAuth(jwt);

  const { data, error } = await client
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

// Get user by ID
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
