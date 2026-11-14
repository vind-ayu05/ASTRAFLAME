import { Router } from 'express';
import { uploadResearchFile, listResearchFiles } from '../controllers/storageController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { validateStorageUpload } from '../middleware/validation.ts';

export const storageRouter = Router();

// Storage operations: write requires authentication and payload validation
storageRouter.post('/upload', requireAuth, validateStorageUpload, uploadResearchFile);
storageRouter.get('/files', listResearchFiles);
