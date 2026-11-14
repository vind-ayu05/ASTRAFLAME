// In-memory sliding-window rate limiters for API protection
import type { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../utils/logger.ts';
import { config } from '../config/index.ts';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Generic factory for IP-based rate limiting
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  code: string;
  message: string;
}) {
  const clients = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries every 5 minutes to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return function limiter(req: Request, res: Response, next: NextFunction) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();
    const record = clients.get(ip);

    if (!record || now > record.resetTime) {
      clients.set(ip, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > options.maxRequests) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip,
        path: req.originalUrl || req.path,
        method: req.method,
        reason: `Exceeded ${options.maxRequests} requests within ${options.windowMs / 1000}s`,
      });

      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        error: options.message,
        code: options.code,
      });
    }

    next();
  };
}

// 1. General API Rate Limiter
export const rateLimiter = createRateLimiter({
  windowMs: config.rateLimits.apiWindowMs,
  maxRequests: config.rateLimits.apiMaxRequests,
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Too many requests to ASTRAFLAME API. Please slow down and try again later.',
});

// 2. Strict Authentication Rate Limiter (Brute-force protection for login/register)
export const authRateLimiter = createRateLimiter({
  windowMs: config.rateLimits.authWindowMs,
  maxRequests: config.rateLimits.authMaxRequests,
  code: 'AUTH_RATE_LIMIT_EXCEEDED',
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

// 3. AI Chatbot Rate Limiter (Protection against denial-of-service / quota drain)
export const chatRateLimiter = createRateLimiter({
  windowMs: config.rateLimits.chatWindowMs,
  maxRequests: config.rateLimits.chatMaxRequests,
  code: 'CHAT_RATE_LIMIT_EXCEEDED',
  message: 'Chatbot query limit reached. Please wait a minute before asking more research questions.',
});

// 4. Admin and Migration Operations Limiter
export const adminRateLimiter = createRateLimiter({
  windowMs: config.rateLimits.adminWindowMs,
  maxRequests: config.rateLimits.adminMaxRequests,
  code: 'ADMIN_RATE_LIMIT_EXCEEDED',
  message: 'Administrative endpoint rate limit reached.',
});
