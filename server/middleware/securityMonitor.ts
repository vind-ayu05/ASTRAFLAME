// ASTRAFLAME – Security Monitor Middleware
// Tracks failed logins, 404 rates, and API enumeration per IP.
// Emits SUSPICIOUS_TRAFFIC security events when thresholds are exceeded.

import type { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../utils/logger.ts';
import { blockIp, isBlocked } from './ipBlocklist.ts';

// ---------------------------------------------------------------------------
// Sliding-window counter (IP → event timestamps)
// ---------------------------------------------------------------------------
function slidingWindowCount(timestamps: number[], windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter((t) => t > cutoff).length;
}

// ---------------------------------------------------------------------------
// Per-IP tracking stores
// ---------------------------------------------------------------------------
interface IpRecord {
  failedLogins: number[];
  notFoundHits: number[];
  endpointHits: Set<string>;
  endpointHitTimes: number[];
}

const ipRecords = new Map<string, IpRecord>();
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 min

function getRecord(ip: string): IpRecord {
  if (!ipRecords.has(ip)) {
    ipRecords.set(ip, {
      failedLogins: [],
      notFoundHits: [],
      endpointHits: new Set(),
      endpointHitTimes: [],
    });
  }
  return ipRecords.get(ip)!;
}

// Housekeeping: drop stale records every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [ip, rec] of ipRecords.entries()) {
    rec.failedLogins = rec.failedLogins.filter((t) => t > cutoff);
    rec.notFoundHits = rec.notFoundHits.filter((t) => t > cutoff);
    rec.endpointHitTimes = rec.endpointHitTimes.filter((t) => t > cutoff);
    if (
      rec.failedLogins.length === 0 &&
      rec.notFoundHits.length === 0 &&
      rec.endpointHitTimes.length === 0
    ) {
      ipRecords.delete(ip);
    }
  }
}, CLEANUP_INTERVAL_MS);

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------
const FAILED_LOGIN_THRESHOLD = 10;      // 10 failures in 15 min → suspicious
const NOT_FOUND_THRESHOLD = 30;         // 30 × 404 in 5 min → scanner
const ENDPOINT_ENUM_THRESHOLD = 20;     // 20 distinct endpoints in 2 min → enumeration
const WINDOW_15_MIN = 15 * 60 * 1000;
const WINDOW_5_MIN  =  5 * 60 * 1000;
const WINDOW_2_MIN  =  2 * 60 * 1000;
const AUTO_BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Record a failed login event for an IP (called from auth controller)
// ---------------------------------------------------------------------------
export function recordFailedLogin(ip: string): void {
  const rec = getRecord(ip);
  rec.failedLogins.push(Date.now());

  const count = slidingWindowCount(rec.failedLogins, WINDOW_15_MIN);
  if (count >= FAILED_LOGIN_THRESHOLD) {
    logSecurityEvent('SUSPICIOUS_PAYLOAD', {
      ip,
      reason: 'brute_force_login',
      metadata: { failedAttempts: count, window: '15m' },
    });
    blockIp(ip, AUTO_BLOCK_DURATION_MS, `Brute force: ${count} failed logins in 15 min`);
  }
}

// ---------------------------------------------------------------------------
// Global security monitor middleware (mount early in Express pipeline)
// ---------------------------------------------------------------------------
export function securityMonitorMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? 'unknown';

  // Skip health probes from monitoring
  if (req.path === '/api/health' || req.path === '/favicon.ico') {
    return next();
  }

  const rec = getRecord(ip);
  const now = Date.now();

  // Track endpoint diversity (enumeration detection)
  rec.endpointHits.add(req.path);
  rec.endpointHitTimes.push(now);

  const recentEndpointHits = slidingWindowCount(rec.endpointHitTimes, WINDOW_2_MIN);
  const uniqueEndpoints = (() => {
    // Count distinct endpoints hit in the last 2 min
    const cutoff = now - WINDOW_2_MIN;
    const recent = rec.endpointHitTimes.filter((t) => t > cutoff);
    // Approximate: unique count ≈ endpointHits set size if window fresh
    return Math.min(rec.endpointHits.size, recent.length);
  })();

  if (uniqueEndpoints >= ENDPOINT_ENUM_THRESHOLD && recentEndpointHits >= ENDPOINT_ENUM_THRESHOLD) {
    logSecurityEvent('SUSPICIOUS_PAYLOAD', {
      ip,
      reason: 'api_enumeration',
      metadata: { uniqueEndpoints, requestsIn2Min: recentEndpointHits },
    });
    // Auto-block persistent enumerators
    if (uniqueEndpoints >= ENDPOINT_ENUM_THRESHOLD * 2 && !isBlocked(ip)) {
      blockIp(ip, AUTO_BLOCK_DURATION_MS, `API enumeration: ${uniqueEndpoints} distinct endpoints`);
    }
  }

  // Track 404 responses (post-response hook)
  res.on('finish', () => {
    if (res.statusCode === 404) {
      rec.notFoundHits.push(Date.now());
      const notFoundCount = slidingWindowCount(rec.notFoundHits, WINDOW_5_MIN);
      if (notFoundCount >= NOT_FOUND_THRESHOLD) {
        logSecurityEvent('SUSPICIOUS_PAYLOAD', {
          ip,
          reason: 'scanner_404_rate',
          metadata: { notFoundCount, window: '5m' },
        });
        if (!isBlocked(ip)) {
          blockIp(ip, AUTO_BLOCK_DURATION_MS, `Scanner: ${notFoundCount} × 404 in 5 min`);
        }
      }
    }

    // Log unusual traffic spikes (high request rate from one IP)
    if (recentEndpointHits >= 100) {
      logSecurityEvent('SUSPICIOUS_PAYLOAD', {
        ip,
        path: req.path,
        reason: 'high_request_rate',
        metadata: { requestsIn2Min: recentEndpointHits },
      });
    }
  });

  next();
}

// ---------------------------------------------------------------------------
// Export current stats for admin endpoint
// ---------------------------------------------------------------------------
export function getMonitorStats(): Record<string, unknown> {
  return {
    trackedIps: ipRecords.size,
    // Don't expose individual IP details – just totals for monitoring
    summary: `${ipRecords.size} IPs tracked`,
  };
}
