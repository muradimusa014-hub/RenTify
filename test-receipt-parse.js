const { PrismaClient } = require('@prisma/client');
const url = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=1";
const prisma = new PrismaClient({ datasources: { db: { url } } });

function parseDataUrl(dataUrl) {
  if (!dataUrl) return null;
  let cleaned = dataUrl;
  if (cleaned.includes(';base64%2C')) {
    cleaned = cleaned.replace(/;base64%2C/g, ';base64,');
  }
  const match = cleaned.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) {
    if (cleaned.startsWith('data:') && cleaned.includes('base64')) {
      const parts = cleaned.split('base64');
      const mime = parts[0].replace('data:', '').replace(';', '') || 'image/jpeg';
      const b64 = parts[1].replace(/^[,%2C]+/, '');
      return { mimeType: mime, buffer: Buffer.from(b64, 'base64') };
    }
    return null;
  }
  const mimeType = match[1] || 'image/jpeg';
  const base64Payload = match[2];
  return { mimeType, buffer: Buffer.from(base64Payload, 'base64') };
}

async function test() {
  const bookings = await prisma.booking.findMany({
    where: { receiptImage: { not: null } },
    select: { id: true, receiptImage: true }
  });

  for (const b of bookings) {
    const res = parseDataUrl(b.receiptImage);
    console.log(`Booking ${b.id}: parsed MIME: ${res?.mimeType}, buffer length: ${res?.buffer?.length}`);
    const isJpeg = res?.buffer[0] === 0xff && res?.buffer[1] === 0xd8;
    console.log(`Booking ${b.id}: Valid JPEG? ${isJpeg}`);
  }
  await prisma.$disconnect();
}

test().catch(console.error);
