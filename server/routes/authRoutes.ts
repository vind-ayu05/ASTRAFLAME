import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/authController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { authRateLimiter } from '../middleware/rateLimiter.ts';
import { validateAuthInput } from '../middleware/validation.ts';

export const authRouter = Router();

// Rate-limited and validated registration & login endpoints
authRouter.post('/register', authRateLimiter, validateAuthInput, register);
authRouter.post('/login', authRateLimiter, validateAuthInput, login);
authRouter.post('/logout', requireAuth, logout);
authRouter.get('/me', requireAuth, getProfile);
