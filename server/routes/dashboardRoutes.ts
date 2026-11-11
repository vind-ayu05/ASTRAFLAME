import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.ts';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', getDashboardStats);

