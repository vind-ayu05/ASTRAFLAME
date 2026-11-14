// Authentication & Role-Based Authorization Middleware for ASTRAFLAME
import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, supabasePublic } from '../db/supabaseAdmin.ts';
import { config } from '../config/index.ts';
import { logSecurityEvent } from '../utils/logger.ts';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: 'admin' | 'curator' | 'researcher' | string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Extracts and verifies authentication tokens.
 * Checks for:
 * 1. Admin API Key (via 'x-admin-key' header or 'Bearer <ADMIN_API_KEY>')
 * 2. Supabase Auth JWT session token
 * 3. Explicit dev tokens ONLY in development mode when Supabase is unconfigured
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const path = req.originalUrl || req.path;

  // 1. Check for Admin API Key header
  const adminKeyHeader = req.headers['x-admin-key'];
  if (
    config.adminApiKey &&
    adminKeyHeader &&
    typeof adminKeyHeader === 'string' &&
    adminKeyHeader.trim() === config.adminApiKey.trim()
  ) {
    req.user = {
      id: 'admin-system',
      email: 'admin@astraflame.internal',
      role: 'admin',
    };
    return next();
  }

  // 2. Extract Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logSecurityEvent('UNAUTHORIZED_ACCESS', {
      ip,
      path,
      method: req.method,
      reason: 'Missing Authorization Bearer header',
    });

    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing or malformed authorization token.',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.substring(7).trim();

  // Check if Bearer token is the admin key
  if (config.adminApiKey && token === config.adminApiKey) {
    req.user = {
      id: 'admin-system',
      email: 'admin@astraflame.internal',
      role: 'admin',
    };
    return next();
  }

  const client = supabaseAdmin || supabasePublic;

  // Standby / Development fallback (only for explicit known dev tokens)
  if (!client) {
    if (token === 'dev-admin-token') {
      req.user = { id: 'dev-admin-001', email: 'admin@astraflame.internal', role: 'admin' };
      return next();
    }
    if (token === 'dev-curator-token') {
      req.user = { id: 'dev-curator-001', email: 'curator@astraflame.internal', role: 'curator' };
      return next();
    }
    if (token === 'dev-token') {
      req.user = { id: 'dev-user-001', email: 'researcher@astraflame.internal', role: 'researcher' };
      return next();
    }

    logSecurityEvent('UNAUTHORIZED_ACCESS', {
      ip,
      path,
      method: req.method,
      reason: 'Invalid authentication token in development mode',
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid authentication credentials',
      code: 'TOKEN_INVALID',
    });
  }

  // Verify against Supabase Auth
  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      logSecurityEvent('AUTH_FAILED', {
        ip,
        path,
        method: req.method,
        reason: error?.message || 'Supabase token verification failed',
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please sign in again.',
        code: 'TOKEN_INVALID',
      });
    }

    const assignedRole =
      (user.app_metadata && user.app_metadata.role) ||
      (user.user_metadata && user.user_metadata.role) ||
      'researcher';

    req.user = {
      id: user.id,
      email: user.email,
      role: assignedRole,
    };

    next();
  } catch (err: any) {
    logSecurityEvent('AUTH_FAILED', {
      ip,
      path,
      method: req.method,
      reason: `Exception during token check: ${err.message}`,
    });

    return res.status(500).json({
      success: false,
      error: 'Authentication verification service error',
      code: 'AUTH_VERIFICATION_ERROR',
    });
  }
}

/**
 * Optional authentication middleware for endpoints where anonymous access is allowed,
 * but user context is utilized when available.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];

  if (config.adminApiKey && adminKey && adminKey === config.adminApiKey) {
    req.user = { id: 'admin-system', email: 'admin@astraflame.internal', role: 'admin' };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();

  if (token === 'dev-admin-token') {
    req.user = { id: 'dev-admin-001', email: 'admin@astraflame.internal', role: 'admin' };
    return next();
  }
  if (token === 'dev-curator-token') {
    req.user = { id: 'dev-curator-001', email: 'curator@astraflame.internal', role: 'curator' };
    return next();
  }
  if (token === 'dev-token') {
    req.user = { id: 'dev-user-001', email: 'researcher@astraflame.internal', role: 'researcher' };
    return next();
  }

  const client = supabaseAdmin || supabasePublic;
  if (!client) return next();

  try {
    const { data: { user } } = await client.auth.getUser(token);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role:
          (user.app_metadata && user.app_metadata.role) ||
          (user.user_metadata && user.user_metadata.role) ||
          'researcher',
      };
    }
  } catch {
    // Ignore optional auth failure
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) middleware.
 * Guarantees that only users holding at least one of the specified roles can access the endpoint.
 */
export function requireRole(...allowedRoles: string[]) {
  return function roleChecker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required before checking permissions.',
        code: 'UNAUTHORIZED',
      });
    }

    const userRole = req.user.role || 'researcher';

    // Admins have universal privileges
    if (userRole === 'admin' || allowedRoles.includes(userRole)) {
      return next();
    }

    logSecurityEvent('FORBIDDEN_ATTEMPT', {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      path: req.originalUrl || req.path,
      method: req.method,
      userId: req.user.id,
      reason: `User with role '${userRole}' denied access. Required: [${allowedRoles.join(', ')}]`,
    });

    return res.status(403).json({
      success: false,
      error: 'Forbidden: You do not possess the required permissions to perform this action.',
      code: 'FORBIDDEN',
    });
  };
}
