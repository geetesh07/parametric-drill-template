/**
 * Security middleware to protect against esbuild development server vulnerabilities
 * This file provides additional security measures for the development environment
 */

import { Request, Response, NextFunction } from 'express';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Maximum requests per window
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  // Basic rate limiting
  const ip = req.ip || req.socket.remoteAddress;
  if (ip) {
    const now = Date.now();
    const userRequests = requestCounts.get(ip);

    if (!userRequests || now > userRequests.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (userRequests.count >= MAX_REQUESTS) {
      return res.status(429).json({ error: 'Too many requests' });
    } else {
      userRequests.count++;
    }
  }

  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }

  next();
};

// Input sanitization function
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  // Don't expose internal errors to the client
  res.status(500).json({
    error: 'An internal server error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};

/**
 * IMPORTANT SECURITY NOTICE:
 * 
 * The esbuild development server has a vulnerability that allows any website to send
 * requests to it and read the responses. This is a serious security issue.
 * 
 * To mitigate this risk:
 * 
 * 1. Always use the security headers and CORS restrictions added in vite.config.ts
 * 2. Never run the development server on a public network
 * 3. Consider using a reverse proxy with additional security measures
 * 4. For production, always use a proper build with 'npm run build'
 * 5. Keep your dependencies updated to the latest versions
 * 
 * If you need to expose your development server, consider using a VPN or SSH tunnel
 * instead of exposing it directly to the internet.
 */ 