const { PrismaClient } = require('@prisma/client');

async function checkBooking() {
  const url = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=1&connect_timeout=10";
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    console.log('1. Checking Booking count with raw query...');
    const count = await prisma.$queryRawUnsafe('SELECT COUNT(*)::text as c FROM "Booking";');
    console.log('Booking count:', count);

    console.log('2. Checking Booking rows (excluding receiptImage content)...');
    const rows = await prisma.$queryRawUnsafe('SELECT id, status, "propertyId", "tenantId", length("receiptImage") as receipt_len, "createdAt" FROM "Booking";');
    console.log('Booking rows:', rows);

    console.log('3. Checking pg_stat_activity...');
    const activity = await prisma.$queryRawUnsafe("SELECT pid, state, wait_event_type, wait_event, query FROM pg_stat_activity WHERE state != 'idle';");
    console.log('Active queries:', activity);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkBooking();
