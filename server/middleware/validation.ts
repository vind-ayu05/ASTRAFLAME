// Input Validation and Data Sanitization Middleware
import type { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../utils/logger.ts';

/**
 * Basic string sanitization: strips HTML tags and escapes dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Validates user registration / login input
 */
export function validateAuthInput(req: Request, res: Response, next: NextFunction) {
  const { email, password, name } = req.body || {};

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'A valid email address is required.',
      code: 'INVALID_EMAIL',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long.',
      code: 'PASSWORD_TOO_SHORT',
    });
  }

  if (password.length > 128) {
    return res.status(400).json({
      success: false,
      error: 'Password exceeds maximum allowed length.',
      code: 'PASSWORD_TOO_LONG',
    });
  }

  if (name && typeof name === 'string') {
    req.body.name = sanitizeString(name).slice(0, 100);
  }

  req.body.email = email.toLowerCase().trim();
  next();
}

const VALID_GRAVITIES = ['microgravity', 'lunar', 'mars', '1g', 'partial'];
const VALID_GEOMETRIES = ['flat-sheet', 'fabric', 'cylinder', 'slab', 'pellet'];
const VALID_FLOWS = ['concurrent', 'opposed', 'quiescent'];

/**
 * Validates evidence record creation & updates
 */
export function validateEvidenceInput(req: Request, res: Response, next: NextFunction) {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request body.',
      code: 'INVALID_PAYLOAD',
    });
  }

  // If creating, require record_id and investigation
  if (req.method === 'POST') {
    if (!body.record_id || typeof body.record_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'record_id string is required.',
        code: 'MISSING_RECORD_ID',
      });
    }

    if (!body.investigation || typeof body.investigation !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'investigation title string is required.',
        code: 'MISSING_INVESTIGATION',
      });
    }
  }

  // Sanitize key string fields if provided
  const stringFields = [
    'record_id',
    'investigation',
    'sample_id',
    'material_family',
    'material_type',
    'outcome',
    'confidence',
    'source_id',
    'notes',
  ];

  for (const field of stringFields) {
    if (body[field] && typeof body[field] === 'string') {
      body[field] = sanitizeString(body[field]);
    }
  }

  // Validate gravity_category if present
  if (body.gravity_category && !VALID_GRAVITIES.includes(body.gravity_category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid gravity_category. Allowed values: ${VALID_GRAVITIES.join(', ')}`,
      code: 'INVALID_GRAVITY_CATEGORY',
    });
  }

  // Validate geometry if present
  if (body.geometry && !VALID_GEOMETRIES.includes(body.geometry)) {
    return res.status(400).json({
      success: false,
      error: `Invalid geometry. Allowed values: ${VALID_GEOMETRIES.join(', ')}`,
      code: 'INVALID_GEOMETRY',
    });
  }

  // Validate flow_direction if present
  if (body.flow_direction && !VALID_FLOWS.includes(body.flow_direction)) {
    return res.status(400).json({
      success: false,
      error: `Invalid flow_direction. Allowed values: ${VALID_FLOWS.join(', ')}`,
      code: 'INVALID_FLOW_DIRECTION',
    });
  }

  next();
}

/**
 * Validates mission scenario inputs
 */
export function validateScenarioInput(req: Request, res: Response, next: NextFunction) {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request body.',
      code: 'INVALID_PAYLOAD',
    });
  }

  if (!body.title || typeof body.title !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Scenario title is required.',
      code: 'MISSING_TITLE',
    });
  }

  body.title = sanitizeString(body.title).slice(0, 200);

  if (body.description && typeof body.description === 'string') {
    body.description = sanitizeString(body.description).slice(0, 1000);
  }

  if (body.gravity_category && !VALID_GRAVITIES.includes(body.gravity_category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid gravity_category. Allowed: ${VALID_GRAVITIES.join(', ')}`,
      code: 'INVALID_GRAVITY_CATEGORY',
    });
  }

  next();
}

/**
 * Validates file upload payloads
 */
export function validateStorageUpload(req: Request, res: Response, next: NextFunction) {
  const { fileName, fileContentBase64 } = req.body || {};

  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'fileName string is required.',
      code: 'MISSING_FILENAME',
    });
  }

  // Path traversal prevention: strip any directory separators or '../'
  const safeFileName = fileName.replace(/[/\\?%*:|"<>]/g, '_').trim();
  if (!safeFileName || safeFileName.includes('..')) {
    logSecurityEvent('SUSPICIOUS_PAYLOAD', {
      ip: req.ip,
      reason: `Path traversal attempt detected in fileName: ${fileName}`,
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid file name. Path traversal characters are not permitted.',
      code: 'INVALID_FILENAME',
    });
  }

  // Allowed file extensions
  const allowedExtensions = ['.pdf', '.txt', '.csv', '.json', '.png', '.jpg', '.jpeg'];
  const hasValidExt = allowedExtensions.some((ext) => safeFileName.toLowerCase().endsWith(ext));

  if (!hasValidExt) {
    return res.status(400).json({
      success: false,
      error: `Disallowed file type. Allowed extensions: ${allowedExtensions.join(', ')}`,
      code: 'DISALLOWED_FILE_TYPE',
    });
  }

  if (!fileContentBase64 || typeof fileContentBase64 !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'fileContentBase64 payload is required.',
      code: 'MISSING_FILE_CONTENT',
    });
  }

  // Size validation: max 10MB base64 ~ 7.5MB raw file
  if (fileContentBase64.length > 10 * 1024 * 1024 * 1.37) {
    return res.status(413).json({
      success: false,
      error: 'Uploaded file exceeds maximum limit of 10MB.',
      code: 'FILE_TOO_LARGE',
    });
  }

  req.body.fileName = safeFileName;
  next();
}
