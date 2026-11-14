// ASTRAFLAME – Request Security Middleware
// Provides: suspicious UA detection, bot fingerprinting, request ID generation,
// IP-based concurrent request tracking, and slow-loris protection hints.

import type { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../utils/logger.ts';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Known malicious / scanner user-agents (case-insensitive substring match)
// ---------------------------------------------------------------------------
const SUSPICIOUS_UA_PATTERNS = [
  'sqlmap',
  'nikto',
  'masscan',
  'nmap',
  'nessus',
  'acunetix',
  'burpsuite',
  'dirbuster',
  'nuclei',
  'gobuster',
  'wfuzz',
  'hydra',
  'medusa',
  'openvas',
  'zgrab',
  'python-requests',   // commonly used for scripted abuse; monitor don't block
  'go-http-client',
  'curl',              // monitor only – many legitimate uses
];

// High-confidence scanner UAs that should be blocked outright
const BLOCKED_UA_PATTERNS = [
  'sqlmap',
  'nikto',
  'masscan',
  'acunetix',
  'burpsuite',
  'nuclei',
];

// ---------------------------------------------------------------------------
// In-memory concurrent request counter per IP (sliding window)
// ---------------------------------------------------------------------------
const concurrentRequests = new Map<string, number>();
const MAX_CONCURRENT_PER_IP = 50; // requests in-flight at the same time

function incrementConcurrent(ip: string): void {
  concurrentRequests.set(ip, (concurrentRequests.get(ip) ?? 0) + 1);
}
function decrementConcurrent(ip: string): void {
  const count = (concurrentRequests.get(ip) ?? 1) - 1;
  if (count <= 0) {
    concurrentRequests.delete(ip);
  } else {
    concurrentRequests.set(ip, count);
  }
}

// ---------------------------------------------------------------------------
// 1. Request ID middleware – attach X-Request-ID for distributed tracing
// ---------------------------------------------------------------------------
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const reqId = (req.headers['x-request-id'] as string) || randomUUID();
  (req as any).requestId = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
}

// ---------------------------------------------------------------------------
// 2. Suspicious user-agent detection
// ---------------------------------------------------------------------------
export function uaDetectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ua = (req.headers['user-agent'] || '').toLowerCase();

  if (!ua) {
    // Empty UA – monitor but don't hard-block (health checkers, internal tools)
    logSecurityEvent('SUSPICIOUS_PAYLOAD', {
      ip: req.ip,
      path: req.path,
      reason: 'empty_user_agent',
    });
    return next();
  }

  // Block high-confidence scanners
  for (const pattern of BLOCKED_UA_PATTERNS) {
    if (ua.includes(pattern)) {
      logSecurityEvent('SUSPICIOUS_PAYLOAD', {
        ip: req.ip,
        path: req.path,
        reason: 'blocked_scanner_ua',
        metadata: { ua: ua.substring(0, 100) },
      });
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
  }

  // Log (but allow) suspicious UAs
  for (const pattern of SUSPICIOUS_UA_PATTERNS) {
    if (ua.includes(pattern)) {
      logSecurityEvent('SUSPICIOUS_PAYLOAD', {
        ip: req.ip,
        path: req.path,
        reason: 'suspicious_user_agent',
        metadata: { ua: ua.substring(0, 100) },
      });
      break;
    }
  }

  next();
}

// ---------------------------------------------------------------------------
// 3. Concurrent request limiter per IP
// ---------------------------------------------------------------------------
export function concurrentLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? 'unknown';
  const current = concurrentRequests.get(ip) ?? 0;

  if (current >= MAX_CONCURRENT_PER_IP) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip,
      path: req.path,
      reason: 'concurrent_request_limit',
      metadata: { count: current },
    });
    res.status(429).json({
      success: false,
      error: 'Too many concurrent requests. Please slow down.',
    });
    return;
  }

  incrementConcurrent(ip);

  // Decrement when response finishes (success or error)
  res.on('finish', () => decrementConcurrent(ip));
  res.on('close', () => decrementConcurrent(ip));

  next();
}

// ---------------------------------------------------------------------------
// 4. HTTP parameter pollution guard
//    Collapses duplicate query params – prevents HPP bypass attacks
// ---------------------------------------------------------------------------
export function hppGuardMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (Array.isArray(req.query[key])) {
        // Keep only the last value to avoid HPP attacks
        const arr = req.query[key] as string[];
        req.query[key] = arr[arr.length - 1];
      }
    }
  }
  next();
}

// ---------------------------------------------------------------------------
// 5. Header injection guard
//    Strip CR/LF from string headers to prevent HTTP response splitting
// ---------------------------------------------------------------------------
export function headerInjectionGuard(req: Request, res: Response, next: NextFunction): void {
  const dangerousHeaders = ['referer', 'x-forwarded-for', 'x-real-ip', 'origin'];
  for (const header of dangerousHeaders) {
    if (req.headers[header] && typeof req.headers[header] === 'string') {
      req.headers[header] = (req.headers[header] as string).replace(/[\r\n]/g, '');
    }
  }
  next();
}

// ---------------------------------------------------------------------------
// 6. Prototype pollution guard for req.body
//    Removes __proto__, constructor, prototype keys from parsed JSON bodies
// ---------------------------------------------------------------------------
function sanitizeProtoPollution(obj: unknown, depth = 0): unknown {
  if (depth > 10 || obj === null || typeof obj !== 'object') return obj;
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  for (const key of dangerous) {
    if (key in (obj as Record<string, unknown>)) {
      delete (obj as Record<string, unknown>)[key];
      logSecurityEvent('SUSPICIOUS_PAYLOAD', { reason: 'prototype_pollution_attempt' });
    }
  }
  for (const val of Object.values(obj as Record<string, unknown>)) {
    sanitizeProtoPollution(val, depth + 1);
  }
  return obj;
}

export function protoPollutionGuard(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeProtoPollution(req.body);
  }
  next();
}

// ---------------------------------------------------------------------------
// Composite export: attach all request security middleware in one call
// ---------------------------------------------------------------------------
export const requestSecurityMiddlewares = [
  requestIdMiddleware,
  headerInjectionGuard,
  uaDetectionMiddleware,
  concurrentLimiterMiddleware,
  hppGuardMiddleware,
  protoPollutionGuard,
];
