import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'MODE',
  'PORT'
];

// Validate required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const config = {
  mode: process.env.MODE || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
  },
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTokenExpiry: '10m',
    refreshTokenExpiry: '7d',
  },
  cors: {
    origin: process.env.MODE === 'development' 
      ? 'http://localhost:5173' 
      : 'https://www.mowzaic.com',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  },
  rateLimit: {
    windowMs: 1 * 60 * 1000,
    max: process.env.MODE === 'development' ? 100 : 50,
  },
  cookie: {
    secret: process.env.COOKIE_SECRET || 'your-secret-key',
    options: {
      httpOnly: true,
      secure: process.env.MODE === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      sameSite: 'strict',
    },
  },
  logging: {
    level: process.env.MODE === 'development' ? 'debug' : 'info',
    format: process.env.MODE === 'development' ? 'dev' : 'combined',
  },
};

export default config;
