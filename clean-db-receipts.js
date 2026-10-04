const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('Checking for bookings with encoded receipts...');
  const bookings = await prisma.booking.findMany({
    where: { receiptImage: { contains: ';base64%2C' } },
    select: { id: true, receiptImage: true }
  });
  console.log(`Found ${bookings.length} booking(s) needing receipt cleanup.`);

  for (const b of bookings) {
    const fixed = b.receiptImage.replace(/;base64%2C/g, ';base64,');
    await prisma.booking.update({
      where: { id: b.id },
      data: { receiptImage: fixed }
    });
    console.log(`✓ Cleaned booking: ${b.id}`);
  }

  console.log('Database receipt cleanup completed successfully.');
  await prisma.$disconnect();
}

clean().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
