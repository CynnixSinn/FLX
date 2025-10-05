import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cors from 'cors';

// Rate limiting middleware
export const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
});

// Security middleware configuration
export const securityMiddleware = [
  // Set security headers
  helmet({
    crossOriginEmbedderPolicy: false, // Required for some React features
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.example.com"], // Add your API endpoints
      },
    },
  }),
  
  // Enable CORS with specific origin in production
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }),
  
  // Prevent HTTP parameter pollution
  hpp(),
  
  // Sanitize data to prevent NoSQL injection
  mongoSanitize(),
  
  // Prevent XSS attacks
  xss(),
];