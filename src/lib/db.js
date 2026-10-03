export const runtime = 'nodejs';

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let prismaInstance = globalForPrisma.prisma;

if (!prismaInstance) {
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;

/**
 * Executes a database query function with automatic retries on transient connection failures.
 */
export async function withRetry(fn, retries = 3, delayMs = 400) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn(prisma);
    } catch (error) {
      lastError = error;
      const msg = String(error?.message || '');
      const code = error?.code;
      const isConnectionError =
        msg.includes("Can't reach database server") ||
        msg.includes("connection closed") ||
        msg.includes("Timed out") ||
        msg.includes("Engine") ||
        msg.includes("socket") ||
        code === 'P1001' ||
        code === 'P1002' ||
        code === 'P1017' ||
        code === 'P2024';

      if (isConnectionError && attempt < retries - 1) {
        console.warn(`[DB Retry] Transient DB error (${code || 'connection'}). Attempt ${attempt + 1}/${retries}. Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

export default prisma;

