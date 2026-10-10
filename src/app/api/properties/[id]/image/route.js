export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withRetry } from '@/lib/db';
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
    const { searchParams } = new URL(request.url);
    const index = parseInt(searchParams.get('index') || '0', 10);

    const property = await withRetry((db) =>
      db.property.findUnique({
        where: { id },
        select: { id: true, images: true },
      })
    );

    if (!property || !property.images) {
      return new Response('Property image not found', { status: 404 });
    }

    // Handle comma-separated list of images
    // Notice: data URLs might contain encoded %2C, so split on comma
    const imagesList = property.images.split(',');
    const targetImage = imagesList[index] || imagesList[0];

    if (!targetImage) {
      return new Response('Image index not found', { status: 404 });
    }

    // 1. External HTTP URL (Unsplash, Supabase Storage, CDN)
    if (targetImage.startsWith('http://') || targetImage.startsWith('https://')) {
      return NextResponse.redirect(targetImage, 302);
    }

    // 2. Data URL (Base64 JPEG, PNG, WEBP)
    if (targetImage.startsWith('data:')) {
      const parsed = parseDataUrl(targetImage);
      if (parsed && parsed.buffer) {
        return new Response(parsed.buffer, {
          status: 200,
          headers: {
            'Content-Type': parsed.mimeType,
            'Content-Length': parsed.buffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    // 3. Local relative file (/uploads/properties/xxx.jpg)
    if (targetImage.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', targetImage.replace(/^\//, ''));
      if (existsSync(filePath)) {
        const buffer = await readFile(filePath);
        const ext = targetImage.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    return new Response('Unable to serve image', { status: 404 });
  } catch (error) {
    console.error('Fetch Property Image Error:', error);
    return new Response('Server error loading property image', { status: 500 });
  }
}
