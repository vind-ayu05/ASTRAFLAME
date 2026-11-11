// Authentication middleware verifying Supabase JWT sessions
import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, supabasePublic } from '../db/supabaseAdmin.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token missing or invalid',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.split(' ')[1];
  const client = supabaseAdmin || supabasePublic;

  if (!client) {
    // If Supabase is in standby/dev mode, allow dev-bearer token
    if (token === 'dev-token' || process.env.NODE_ENV === 'development') {
      req.user = { id: 'dev-user-001', email: 'researcher@astraflame.internal', role: 'curator' };
      return next();
    }
    return res.status(503).json({
      success: false,
      error: 'Authentication service unavailable (Supabase not configured)',
      code: 'AUTH_UNAVAILABLE',
    });
  }

  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication session',
        code: 'TOKEN_INVALID',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: (user.app_metadata && user.app_metadata.role) || 'researcher',
    };
    next();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Auth verification failed: ${err.message}`,
      code: 'AUTH_ERROR',
    });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const client = supabaseAdmin || supabasePublic;
  if (!client) return next();

  try {
    const { data: { user } } = await client.auth.getUser(token);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: (user.app_metadata && user.app_metadata.role) || 'researcher',
      };
    }
  } catch {
    // Ignore optional auth error
  }
  next();
}

