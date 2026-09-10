export const runtime = 'nodejs';

import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

/**
 * Executes a database query function with automatic retries on transient connection failures.
 */
export async function withRetry(fn, retries = 2, delayMs = 500) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(prisma);
    } catch (error) {
      lastError = error;
      const isConnectionError =
        error?.message?.includes("Can't reach database server") ||
        error?.message?.includes("connection closed") ||
        error?.message?.includes("Timed out") ||
        error?.code === 'P1001' ||
        error?.code === 'P1002' ||
        error?.code === 'P1017';

      if (isConnectionError && attempt < retries) {
        console.warn(`[DB Retry] Transient DB error on attempt ${attempt + 1}/${retries + 1}. Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

export default prisma;
