// Authentication Controller
import type { Request, Response } from 'express';
import { supabaseAdmin, supabasePublic } from '../db/supabaseAdmin.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const client = supabaseAdmin || supabasePublic;
  if (!client) {
    // Development mode registration fallback
    return res.status(201).json({
      success: true,
      message: 'Account registered (local development mode)',
      user: { id: `dev-${Date.now()}`, email, name: name || 'Researcher' },
      token: 'dev-token',
    });
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || '' },
      },
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const client = supabaseAdmin || supabasePublic;
  if (!client) {
    // Development mode login fallback
    return res.json({
      success: true,
      message: 'Logged in successfully (local development mode)',
      user: { id: 'dev-user-001', email, name: 'Researcher' },
      token: 'dev-token',
    });
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function logout(_req: AuthenticatedRequest, res: Response) {
  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      await client.auth.signOut();
    } catch {
      // Ignore
    }
  }
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  res.json({ success: true, user: req.user });
}
