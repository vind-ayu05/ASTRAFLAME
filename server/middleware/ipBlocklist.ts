// ASTRAFLAME – In-Memory IP Blocklist
// Provides temporary IP banning for detected attackers.
// Entries auto-expire; never persisted to disk (restarts clear the list).

import type { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../utils/logger.ts';

interface BlockEntry {
  ip: string;
  reason: string;
  blockedAt: number;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Blocklist store
// ---------------------------------------------------------------------------
const blocklist = new Map<string, BlockEntry>();

// Auto-expire cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of blocklist.entries()) {
    if (entry.expiresAt < now) {
      blocklist.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ---------------------------------------------------------------------------
// Block / unblock / query functions
// ---------------------------------------------------------------------------
export function blockIp(ip: string, durationMs: number, reason: string): void {
  if (!ip || ip === 'unknown' || ip === '::1' || ip === '127.0.0.1') {
    // Never block localhost
    return;
  }

  const now = Date.now();
  const existing = blocklist.get(ip);

  // Don't shorten an existing block
  if (existing && existing.expiresAt > now + durationMs) {
    return;
  }

  blocklist.set(ip, {
    ip,
    reason,
    blockedAt: now,
    expiresAt: now + durationMs,
  });

  logSecurityEvent('FORBIDDEN_ATTEMPT', {
    ip,
    reason: `IP blocked: ${reason}`,
    metadata: { durationMs, expiresAt: new Date(now + durationMs).toISOString() },
  });
}

export function unblockIp(ip: string): boolean {
  return blocklist.delete(ip);
}

export function isBlocked(ip: string): boolean {
  const entry = blocklist.get(ip);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    blocklist.delete(ip);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Middleware: reject requests from blocked IPs
// ---------------------------------------------------------------------------
export function checkBlocklist(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? 'unknown';

  // Never block localhost / loopback
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'unknown') {
    return next();
  }

  if (isBlocked(ip)) {
    res.status(403).json({
      success: false,
      error: 'Access temporarily restricted. Please try again later.',
    });
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// Admin read access
// ---------------------------------------------------------------------------
export function getBlocklist(): BlockEntry[] {
  const now = Date.now();
  const active: BlockEntry[] = [];
  for (const entry of blocklist.values()) {
    if (entry.expiresAt > now) {
      active.push({ ...entry });
    }
  }
  return active;
}

export function getBlocklistCount(): number {
  return getBlocklist().length;
}
