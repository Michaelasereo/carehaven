import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client Singleton
 * 
 * Prevents multiple instances of Prisma Client in development
 * and ensures proper connection pooling in production.
 * 
 * Usage:
 * import { prisma } from '@/lib/prisma/client'
 * 
 * const users = await prisma.profile.findMany()
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Disconnect Prisma Client
 * Useful for cleanup in scripts or tests
 */
export async function disconnectPrisma() {
  await prisma.$disconnect()
}
