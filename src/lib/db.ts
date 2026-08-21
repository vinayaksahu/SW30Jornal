import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:dummy@ep-dummy-12345.us-east-2.aws.neon.tech/neondb?sslmode=require'
  
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)
  return new PrismaClient({ adapter: adapter as any })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()
export const prisma = db

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
