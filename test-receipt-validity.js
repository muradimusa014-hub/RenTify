const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const url = "postgresql://postgres.sijksxyqigtorjqvrnih:%24Muradi014014@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=1";
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function checkReceiptValidity() {
  const bks = await prisma.booking.findMany({
    where: { receiptImage: { not: null } },
    select: { id: true, receiptImage: true }
  });

  for (const b of bks) {
    let src = b.receiptImage;
    console.log(`\nTesting booking ${b.id}:`);
    console.log('Original length:', src.length);

    // Let's test standard sanitization:
    let cleaned = src;
    if (cleaned.includes(';base64%2C')) {
      cleaned = cleaned.replace(';base64%2C', ';base64,');
    }
    // Check if there are other URL encoded characters
    if (cleaned.includes('%')) {
      console.log('Contains "%" in string! Checking if full URL decode needed...');
      try {
        const decoded = decodeURIComponent(cleaned);
        console.log('decodeURIComponent succeeded. New length:', decoded.length);
        cleaned = decoded;
      } catch (e) {
        console.log('decodeURIComponent failed:', e.message);
      }
    }

    if (cleaned.startsWith('data:image')) {
      const parts = cleaned.split(';base64,');
      if (parts.length === 2) {
        const base64Data = parts[1];
        try {
          const buf = Buffer.from(base64Data, 'base64');
          console.log('Buffer decoded size:', buf.length, 'bytes');
          // Check magic bytes for JPEG (FF D8 FF) or PNG (89 50 4E 47)
          const isJpg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
          const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
          console.log('Is valid JPEG?', isJpg);
          console.log('Is valid PNG?', isPng);
        } catch (e) {
          console.log('Base64 decode failed:', e.message);
        }
      } else {
        console.log('Does NOT split cleanly on ";base64,"! Parts count:', parts.length);
      }
    } else {
      console.log('Does NOT start with data:image. Starts with:', cleaned.slice(0, 50));
    }
  }

  await prisma.$disconnect();
}

checkReceiptValidity().catch(console.error);
