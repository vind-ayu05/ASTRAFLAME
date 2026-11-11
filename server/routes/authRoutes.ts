import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/authController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', requireAuth, logout);
authRouter.get('/me', requireAuth, getProfile);

