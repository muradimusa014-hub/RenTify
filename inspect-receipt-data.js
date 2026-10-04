const { PrismaClient } = require('@prisma/client');
const url = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=1";
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function inspectReceipts() {
  const bks = await prisma.booking.findMany({
    where: { receiptImage: { not: null } },
    select: { id: true, status: true, receiptImage: true }
  });

  for (const b of bks) {
    console.log('ID:', b.id);
    console.log('Status:', b.status);
    console.log('Length:', b.receiptImage?.length);
    console.log('Start:', b.receiptImage?.slice(0, 100));
    console.log('End:', b.receiptImage?.slice(-50));
    console.log('Contains newlines?', b.receiptImage?.includes('\n'));
    console.log('Contains quotes?', b.receiptImage?.startsWith('"') || b.receiptImage?.endsWith('"'));
    console.log('----------------------------------------');
  }
  await prisma.$disconnect();
}

inspectReceipts().catch(console.error);
