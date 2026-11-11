// Prisma ORM Client wrapper for ASTRAFLAME backend.
// Connects directly to the underlying Supabase PostgreSQL database using DATABASE_URL.

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { isPostgresConfigured } from './postgres.ts';

dotenv.config();

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient | null {
  if (!isPostgresConfigured) {
    return null;
  }
  if (!prismaInstance) {
    try {
      prismaInstance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    } catch (e) {
      console.warn('[Prisma] Client initialization deferred:', e);
      return null;
    }
  }
  return prismaInstance;
}

export async function checkPrismaHealth(): Promise<{ ok: boolean; message: string }> {
  if (!isPostgresConfigured) {
    return {
      ok: false,
      message: 'DATABASE_URL is not configured for Prisma ORM.',
    };
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return {
      ok: false,
      message: 'Prisma Client could not be initialized.',
    };
  }

  try {
    const count = await prisma.evidenceRecord.count();
    return {
      ok: true,
      message: `Prisma ORM connected. Total evidence records: ${count}`,
    };
  } catch (err: any) {
    // If schema table does not exist yet or connection fails
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        message: 'Prisma ORM connected successfully (raw query check passed).',
      };
    } catch (rawErr: any) {
      return {
        ok: false,
        message: `Prisma query failed: ${rawErr.message || err.message}`,
      };
    }
  }
}

