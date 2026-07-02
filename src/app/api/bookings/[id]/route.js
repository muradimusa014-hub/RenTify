export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { saveFile } from '@/lib/upload';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: {
          select: { email: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Auth check
    if (
      booking.tenantId !== user.id &&
      booking.property.ownerId !== user.id &&
      user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Fetch Booking Detail Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user || user.role !== 'tenant') {
      return NextResponse.json(
        { error: 'Unauthorized. Tenants only.' },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.tenantId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You do not own this booking.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const receiptFile = formData.get('receipt');

    if (!receiptFile || receiptFile.size === 0) {
      return NextResponse.json(
        { error: 'Payment receipt image is required' },
        { status: 400 }
      );
    }

    const savedPath = await saveFile(receiptFile, 'receipts');
    if (!savedPath) {
      return NextResponse.json(
        { error: 'Failed to save receipt image' },
        { status: 500 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'payment_pending',
        receiptImage: savedPath,
      },
    });

    return NextResponse.json({
      message: 'Receipt uploaded successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Upload Receipt Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
