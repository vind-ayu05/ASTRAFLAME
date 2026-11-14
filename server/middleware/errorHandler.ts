// Centralized Error Handling Middleware for ASTRAFLAME
// Sanitizes error output to avoid disclosing stack traces, DB credentials, or host details.
import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Server-side logging with sensitive credentials redacted
  console.error('[API Error]', {
    statusCode,
    path: req.originalUrl || req.path,
    method: req.method,
    message: err.message,
    code: err.code,
    stack: !isProd ? err.stack : undefined,
  });

  // Client-facing error message sanitization
  let clientMessage = err.message || 'An unexpected error occurred.';

  // If 500 in production, or if message contains DB / credential keywords, mask it
  const leakKeywords = ['postgres', 'supabase', 'password', 'secret', 'jwt', 'prisma', 'connection', 'ECONNREFUSED'];
  const hasLeakage = leakKeywords.some((kw) => clientMessage.toLowerCase().includes(kw));

  if (statusCode === 500 && (isProd || hasLeakage)) {
    clientMessage = 'An internal system error occurred. The request could not be completed.';
  }

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    code: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
    timestamp: new Date().toISOString(),
  });
}
