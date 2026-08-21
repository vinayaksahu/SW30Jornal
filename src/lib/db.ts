import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString && connectionString.startsWith('postgres')) {
    try {
      const pool = new Pool({ connectionString });
      const adapter = new PrismaNeon(pool as any);
      return new PrismaClient({ adapter: adapter as any });
    } catch {
      return new PrismaClient();
    }
  }

  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? createPrismaClient();
export const prisma = db;

// Always cache in globalThis to reuse active pool across warm serverless function invocations
globalForPrisma.prisma = db;

