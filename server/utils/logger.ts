// Security & Audit Logger for ASTRAFLAME
// Provides sanitized, production-oriented security event logging without leaking sensitive credentials.

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'secret',
  'apiKey',
  'apikey',
  'service_role_key',
  'anon_key',
  'cookie',
  'access_token',
  'refresh_token',
]);

/**
 * Deeply sanitizes an object by masking sensitive keys
 */
export function sanitizeLogData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase()) || key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeLogData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export type SecurityEventType =
  | 'AUTH_FAILED'
  | 'AUTH_SUCCESS'
  | 'UNAUTHORIZED_ACCESS'
  | 'FORBIDDEN_ATTEMPT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PROMPT_INJECTION_DETECTED'
  | 'INVALID_INPUT'
  | 'SUSPICIOUS_PAYLOAD'
  | 'ADMIN_ACTION';

export function logSecurityEvent(
  type: SecurityEventType,
  details: {
    ip?: string;
    path?: string;
    method?: string;
    userId?: string;
    reason?: string;
    metadata?: any;
  }
) {
  const timestamp = new Date().toISOString();
  const safeMetadata = details.metadata ? sanitizeLogData(details.metadata) : undefined;

  const logPayload = {
    timestamp,
    level: 'SECURITY_ALERT',
    type,
    ip: details.ip || 'unknown',
    path: details.path,
    method: details.method,
    userId: details.userId,
    reason: details.reason,
    metadata: safeMetadata,
  };

  console.warn(`[SECURITY] [${type}] ${details.reason || ''}`, JSON.stringify(logPayload));
}
