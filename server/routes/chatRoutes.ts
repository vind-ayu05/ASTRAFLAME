import { Router } from 'express';
import { handleChatMessage } from '../controllers/chatController.ts';
import { chatRateLimiter } from '../middleware/rateLimiter.ts';

export const chatRouter = Router();

// Dedicated rate limiter and endpoint for AI chatbot
chatRouter.post('/', chatRateLimiter, handleChatMessage);
