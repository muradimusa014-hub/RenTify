const { PrismaClient } = require('@prisma/client');

async function test(url, label) {
  console.log(`\n=== Testing: ${label} ===`);
  const client = new PrismaClient({
    datasources: { db: { url } },
    log: ['warn', 'error']
  });

  try {
    const t0 = Date.now();
    const users = await client.user.findMany({ select: { id: true, email: true, role: true } });
    console.log(`✓ Users (${Date.now() - t0}ms):`, users.length);

    const t1 = Date.now();
    const properties = await client.property.findMany({ select: { id: true, title: true } });
    console.log(`✓ Properties (${Date.now() - t1}ms):`, properties.length);

    const t2 = Date.now();
    const bookings = await client.booking.findMany({
      select: {
        id: true,
        status: true,
        receiptImage: true,
        tenant: { select: { email: true } },
        property: { select: { title: true } }
      }
    });
    console.log(`✓ Bookings (${Date.now() - t2}ms):`, bookings.length);
    for (const b of bookings) {
      console.log('   Booking:', {
        id: b.id,
        status: b.status,
        receiptLength: b.receiptImage ? b.receiptImage.length : 0,
        receiptType: b.receiptImage ? (b.receiptImage.startsWith('data:') ? 'base64 data URL' : b.receiptImage.startsWith('http') ? 'HTTP URL' : 'path') : 'null',
        receiptSample: b.receiptImage ? b.receiptImage.slice(0, 100) : null
      });
    }

    const t3 = Date.now();
    // Test the exact Promise.all from admin route
    const [u, p, bk] = await Promise.all([
      client.user.findMany({ select: { id: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
      client.property.findMany({ include: { owner: { select: { email: true } } }, orderBy: { createdAt: 'desc' } }),
      client.booking.findMany({ include: { property: true, tenant: { select: { email: true } } }, orderBy: { createdAt: 'desc' } })
    ]);
    console.log(`✓ Admin Promise.all finished in ${Date.now() - t3}ms`);

  } catch (err) {
    console.error(`✗ FAILED for ${label}:`, err.message);
  } finally {
    await client.$disconnect();
  }
}

async function run() {
  const baseSession = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?connection_limit=5&connect_timeout=15";
  const baseSessionSsl = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=5&connect_timeout=15";
  const baseTxPgbouncer = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&connect_timeout=15";

  await test(baseSession, "Session Pooler (5432) without sslmode");
  await test(baseSessionSsl, "Session Pooler (5432) with sslmode=require");
  await test(baseTxPgbouncer, "Transaction Pooler (6543) with pgbouncer=true");
}

run();
