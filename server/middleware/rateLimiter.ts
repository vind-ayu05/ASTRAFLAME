// In-memory sliding-window rate limiter for API protection
import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 200; // 200 requests per minute
const clients = new Map<string, RateLimitRecord>();

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = clients.get(ip);

  if (!record || now > record.resetTime) {
    clients.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down and try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  next();
}

