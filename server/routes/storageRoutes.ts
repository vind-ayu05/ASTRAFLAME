import { Router } from 'express';
import { uploadResearchFile, listResearchFiles } from '../controllers/storageController.ts';

export const storageRouter = Router();

storageRouter.post('/upload', uploadResearchFile);
storageRouter.get('/files', listResearchFiles);

