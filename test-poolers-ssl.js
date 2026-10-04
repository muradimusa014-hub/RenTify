const { PrismaClient } = require('@prisma/client');

async function testUrl(url, label) {
  console.log(`\nTesting: ${label}`);
  const client = new PrismaClient({
    datasources: { db: { url } },
    log: ['error']
  });

  try {
    const start = Date.now();
    const count = await client.user.count();
    console.log(`✓ ${label} SUCCESS in ${Date.now() - start}ms (Users count: ${count})`);
    return true;
  } catch (e) {
    console.error(`✗ ${label} FAILED:`, e.message);
    return false;
  } finally {
    await client.$disconnect();
  }
}

async function main() {
  // Session Pooler with sslmode=require
  const sessionUrl = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=5&connect_timeout=15";
  // Transaction Pooler with pgbouncer=true & sslmode=require
  const txUrl = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connection_limit=5&connect_timeout=15";

  await testUrl(sessionUrl, "Session Pooler (5432) with sslmode=require");
  await testUrl(txUrl, "Transaction Pooler (6543) with sslmode=require & pgbouncer=true");
}

main();
