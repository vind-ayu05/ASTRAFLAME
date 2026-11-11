// Storage Controller for ASTRAFLAME research documents and files
import type { Request, Response } from 'express';
import { supabaseAdmin, supabasePublic } from '../db/supabaseAdmin.ts';
import { config } from '../config/index.ts';

const BUCKET = config.storage.bucket;

export async function uploadResearchFile(req: Request, res: Response) {
  const { fileName, fileContentBase64, contentType } = req.body;

  if (!fileName || !fileContentBase64) {
    return res.status(400).json({ success: false, error: 'fileName and fileContentBase64 are required' });
  }

  const client = supabaseAdmin || supabasePublic;
  if (!client) {
    return res.json({
      success: true,
      message: 'File upload simulated (Supabase Storage in standby mode)',
      url: `https://mock-storage.astraflame.internal/${fileName}`,
      path: `uploads/${fileName}`,
    });
  }

  try {
    const buffer = Buffer.from(fileContentBase64, 'base64');
    const path = `evidence-briefs/${Date.now()}-${fileName}`;

    const { data, error } = await client.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: contentType || 'application/pdf',
        upsert: true,
      });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const { data: publicUrlData } = client.storage.from(BUCKET).getPublicUrl(path);

    res.status(201).json({
      success: true,
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function listResearchFiles(_req: Request, res: Response) {
  const client = supabaseAdmin || supabasePublic;
  if (!client) {
    return res.json({ success: true, files: [] });
  }

  try {
    const { data, error } = await client.storage.from(BUCKET).list('evidence-briefs', {
      limit: 50,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, files: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

