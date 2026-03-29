import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { authRoutes } from "./auth.js";
import { stripeRoutes, stripeWebhookRoute } from "./stripe.js";
import bookingRoutes from "./bookings.js";
import { propertyRoutes } from "./properties.js";
import providerRoutes from "./providers.js";
import estimateRoutes from "./estimates.js";
import subscriptionRoutes from "./subscriptions.js";
import trackingRoutes from "./tracking.js";
import organizationRoutes from "./organizations.js";
import logger from './logger.js';
import { requestIdMiddleware, errorHandler } from './utils.js';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: envFile });

const MODE = process.env.MODE;

// ALLOWED_ORIGINS env var: comma-separated list of origins (e.g. "https://mowzaic.com,https://joselawns.com")
const defaultOrigins = MODE === 'development'
  ? ['http://localhost:5173', 'http://localhost:3001']
  : ['https://www.mowzaic.com', 'https://mowzaic.com', 'https://api.mowzaic.com'];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : defaultOrigins;

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});

// Create an Express app
const app = express();

// Register the Stripe webhook route before body parsers
// This ensures the raw body is available for signature verification
app.use('/webhook', stripeWebhookRoute);

// Security Middlewares - Order is important!
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// CORS middleware must come BEFORE OPTIONS handler
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Other middleware
app.use(limiter);
app.use(express.json());
app.use(cookieParser('secret', {
  httpOnly: true,
  secure: MODE === 'production',
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  sameSite: 'strict',
}));

// Add request ID tracking
app.use(requestIdMiddleware);

// Routes
app.use('/auth', authRoutes);
app.use('/stripe', stripeRoutes);
app.use('/book', bookingRoutes);
app.use('/properties', propertyRoutes);
app.use('/providers', providerRoutes);
app.use('/estimates', estimateRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use(trackingRoutes);
app.use('/organizations', organizationRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start the server
app.listen(process.env.PORT || 3000, () => {
  logger.info(`Server is running on http://localhost:${process.env.PORT || 3000}`);
});
