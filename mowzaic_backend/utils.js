import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

export function gen14days() {
  const today = new Date();
  const availability = Array.from({ length: 14 }, (_, i) => {
    let date = new Date();
    date.setDate(today.getDate() + i + 1); // Start from tomorrow  
    return date.toISOString();
  });
  return availability;
}

export function jwtDecode(token) {
  if (!token) return null;
  const base64Url = token.split('.')[1];
  if (!base64Url) return null;
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
      .join('')
  );
  return JSON.parse(jsonPayload);
}

// supabaseClientWithAuth.js
export const createSupabaseClientWithAuth = (jwt) =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  });

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class DatabaseError extends AppError {
  constructor(message) {
    super(message, 500, 'DATABASE_ERROR');
  }
}

// Request ID middleware
export const requestIdMiddleware = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.id);
  next();
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error with request context
  const errorContext = {
    requestId: req.id,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    error: {
      message: err.message,
      code: err.errorCode || 'UNKNOWN_ERROR',
      stack: process.env.MODE === 'development' ? err.stack : undefined
    }
  };

  // Log error using our logger
  if (err.isOperational) {
    logger.warn('Operational error:', errorContext);
  } else {
    logger.error('Programming error:', errorContext);
  }

  // Send response based on environment
  if (process.env.MODE === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production error response
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Programming or unknown errors
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
};

// Async handler to catch errors in async routes
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
