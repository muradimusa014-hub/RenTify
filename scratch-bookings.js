const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const bookings = await p.booking.findMany({
    select: {
      id: true,
      status: true,
      receiptImage: true,
      createdAt: true,
    }
  });
  console.log('Bookings found:', bookings.length);
  for (const b of bookings) {
    console.log({
      id: b.id,
      status: b.status,
      receiptLength: b.receiptImage ? b.receiptImage.length : null,
      receiptPrefix: b.receiptImage ? b.receiptImage.substring(0, 100) : null,
      createdAt: b.createdAt
    });
  }
}

main().catch(console.error).finally(() => p['$disconnect']());
