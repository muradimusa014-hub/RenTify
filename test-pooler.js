const { PrismaClient } = require('@prisma/client');

async function testConnection(url, name) {
  console.log(`\n--- Testing ${name} ---`);
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    },
    log: ['error']
  });

  for (let i = 1; i <= 5; i++) {
    const start = Date.now();
    try {
      const users = await prisma.user.count();
      const bookings = await prisma.booking.count();
      const props = await prisma.property.count();
      console.log(`[${name}] Run ${i} SUCCESS in ${Date.now() - start}ms. (Users: ${users}, Props: ${props}, Bookings: ${bookings})`);
    } catch (err) {
      console.error(`[${name}] Run ${i} FAILED in ${Date.now() - start}ms:`, err.message);
    }
  }

  await prisma.$disconnect();
}

async function run() {
  const sessionUrl = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?connection_limit=5";
  const transactionUrl = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";
  
  await testConnection(transactionUrl, "Transaction Pooler (port 6543, pgbouncer=true)");
  await testConnection(sessionUrl, "Session Pooler (port 5432)");
}

run();
