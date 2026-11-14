// ASTRAFLAME – In-Memory TTL Cache Middleware
// Caches public read-only API responses to reduce DB load and resist abuse.
// Never caches authenticated, private, or write endpoints.

import type { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  body: string;
  contentType: string;
  statusCode: number;
  expiresAt: number;
}

// Global in-memory store – keys are URL path strings
const store = new Map<string, CacheEntry>();

// Default TTL per route category (ms)
const DEFAULT_TTL_MS = 60_000;      // 60 s for public research reads
const ANALYTICS_TTL_MS = 30_000;    // 30 s for analytics aggregates

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function purgeExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) {
      store.delete(key);
    }
  }
}

// Run cleanup every 2 minutes
setInterval(purgeExpired, 120_000);

// ---------------------------------------------------------------------------
// Cache middleware factory
// Usage: router.get('/evidence', cacheMiddleware(), handler)
// ---------------------------------------------------------------------------
export function cacheMiddleware(ttlMs = DEFAULT_TTL_MS) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests with no authorization header
    if (req.method !== 'GET' || req.headers['authorization'] || req.headers['x-admin-key']) {
      return next();
    }

    const key = req.originalUrl || req.url;
    const now = Date.now();
    const cached = store.get(key);

    if (cached && cached.expiresAt > now) {
      // Serve from cache
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${Math.floor((cached.expiresAt - now) / 1000)}`);
      res.status(cached.statusCode)
        .contentType(cached.contentType)
        .send(cached.body);
      return;
    }

    // Intercept response to store in cache
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = function (data: unknown) {
      // Only cache 2xx successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const body = JSON.stringify(data);
        store.set(key, {
          body,
          contentType: 'application/json',
          statusCode: res.statusCode,
          expiresAt: Date.now() + ttlMs,
        });
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`);
      }
      return originalJson(data);
    };

    res.send = function (body: unknown) {
      return originalSend(body);
    };

    next();
  };
}

// Analytics cache (shorter TTL)
export function analyticsCacheMiddleware() {
  return cacheMiddleware(ANALYTICS_TTL_MS);
}

// ---------------------------------------------------------------------------
// Cache invalidation helper (call after write operations)
// ---------------------------------------------------------------------------
export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Admin endpoint handler: return cache stats (no sensitive data)
// ---------------------------------------------------------------------------
export function getCacheStats(): { entries: number; keys: string[] } {
  purgeExpired();
  return {
    entries: store.size,
    keys: Array.from(store.keys()),
  };
}
