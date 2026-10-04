const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    }
  }
});

async function inspect() {
  console.log('Querying bookings with transaction pooler...');
  const start = Date.now();
  const bookings = await prisma.booking.findMany({
    include: {
      property: true,
      tenant: { select: { email: true } }
    }
  });

  console.log(`Query finished in ${Date.now() - start}ms. Count: ${bookings.length}`);
  for (const b of bookings) {
    console.log({
      id: b.id,
      property: b.property?.title,
      tenant: b.tenant?.email,
      status: b.status,
      receiptImage: b.receiptImage ? {
        length: b.receiptImage.length,
        isBase64: b.receiptImage.startsWith('data:'),
        isHttp: b.receiptImage.startsWith('http'),
        isRelative: b.receiptImage.startsWith('/'),
        sample: b.receiptImage.slice(0, 150)
      } : null
    });
  }
  await prisma.$disconnect();
}

inspect().catch(err => {
  console.error('Inspect error:', err);
  process.exit(1);
});
