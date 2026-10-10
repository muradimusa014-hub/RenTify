const { prisma, withRetry } = require('./src/lib/db');

async function test() {
  try {
    console.log('Testing query...');
    const properties = await withRetry((db) =>
      db.property.findMany({
        where: { status: 'available', isSuspicious: false },
        include: {
          owner: { select: { email: true } },
          _count: { select: { comments: true } },
          reactions: { select: { type: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    );
    console.log('Query success! Count:', properties.length);
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
