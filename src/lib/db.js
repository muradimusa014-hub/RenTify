export const runtime = 'nodejs';

import { PrismaClient } from '@prisma/client';

function getSanitizedDatabaseUrl() {
  let url = process.env.DATABASE_URL || '';
  if (url.startsWith('postgres') || url.startsWith('postgresql')) {
    // Automatically guarantee sslmode=require for hosted Postgres/Supabase
    if (!url.includes('sslmode=')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}sslmode=require`;
    }
    // Prevent indefinite network hang with connect_timeout
    if (!url.includes('connect_timeout=')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}connect_timeout=15`;
    }
  }
  return url;
}

const globalForPrisma = globalThis;

let prismaInstance = globalForPrisma.prisma;

if (!prismaInstance) {
  const sanitizedUrl = getSanitizedDatabaseUrl();
  prismaInstance = new PrismaClient({
    datasources: sanitizedUrl ? { db: { url: sanitizedUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
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

