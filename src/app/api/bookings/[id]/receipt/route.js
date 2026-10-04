export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withRetry } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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
      const mime = parts[0].replace('data:', '').replace(';', '').trim() || 'image/jpeg';
      const b64 = parts[1].replace(/^[,%2C]+/, '').trim();
      return { mimeType: mime, buffer: Buffer.from(b64, 'base64') };
    }
    return null;
  }
  const mimeType = match[1] || 'image/jpeg';
  const base64Payload = match[2];
  return { mimeType, buffer: Buffer.from(base64Payload, 'base64') };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const booking = await withRetry((db) =>
      db.booking.findUnique({
        where: { id },
        select: {
          id: true,
          tenantId: true,
          receiptImage: true,
          property: {
            select: { ownerId: true },
          },
        },
      })
    );

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Permission: Admin, tenant who made the booking, or landlord who owns the property
    const isTenant = booking.tenantId === user.id;
    const isLandlord = booking.property?.ownerId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isTenant && !isLandlord && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const receipt = booking.receiptImage;
    if (!receipt) {
      return NextResponse.json({ error: 'No receipt uploaded for this booking' }, { status: 404 });
    }

    // Case 1: External HTTP URL (e.g. Supabase Storage / Cloudinary)
    if (receipt.startsWith('http://') || receipt.startsWith('https://')) {
      return NextResponse.redirect(receipt, 302);
    }

    // Case 2: Data URL (Base64 JPEG, PNG, WEBP, PDF)
    if (receipt.startsWith('data:')) {
      const parsed = parseDataUrl(receipt);
      if (parsed && parsed.buffer) {
        const ext = parsed.mimeType.includes('pdf') ? 'pdf' : parsed.mimeType.includes('png') ? 'png' : 'jpg';
        return new Response(parsed.buffer, {
          status: 200,
          headers: {
            'Content-Type': parsed.mimeType,
            'Content-Length': parsed.buffer.length.toString(),
            'Content-Disposition': `inline; filename="receipt-${booking.id.slice(0, 8)}.${ext}"`,
            'Cache-Control': 'private, max-age=86400, stale-while-revalidate=86400',
          },
        });
      }
    }

    // Case 3: Local file path (e.g. /uploads/receipts/xxx.jpg)
    if (receipt.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', receipt.replace(/^\//, ''));
      if (existsSync(filePath)) {
        const buffer = await readFile(filePath);
        const ext = receipt.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : ext === 'pdf' ? 'application/pdf' : 'image/jpeg';
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            'Content-Disposition': `inline; filename="receipt-${booking.id.slice(0, 8)}.${ext}"`,
            'Cache-Control': 'private, max-age=86400',
          },
        });
      }
    }

    return NextResponse.json({ error: 'Receipt format unsupported or file not found on server' }, { status: 404 });
  } catch (error) {
    console.error('Fetch Receipt Error:', error);
    return NextResponse.json({ error: 'Server error loading receipt.' }, { status: 500 });
  }
}
