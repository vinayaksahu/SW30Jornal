import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL;
  const isValidUrl =
    rawUrl &&
    rawUrl.trim().length > 0 &&
    (rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://')) &&
    !rawUrl.includes('dummy');

  const connectionString = isValidUrl
    ? rawUrl
    : 'postgresql://neondb_owner:npg_123456@127.0.0.1:5432/neondb?sslmode=disable';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter: adapter as any });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();
export const prisma = db;

// Always cache in globalThis to reuse active pool across warm serverless function invocations
globalForPrisma.prisma = db;

