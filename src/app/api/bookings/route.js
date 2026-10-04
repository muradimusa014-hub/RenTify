export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withRetry } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let bookings = [];

    if (user.role === 'tenant') {
      bookings = await withRetry((db) =>
        db.booking.findMany({
          where: { tenantId: user.id },
          include: {
            property: {
              include: {
                owner: {
                  select: { email: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      );
    } else if (user.role === 'landlord') {
      bookings = await withRetry((db) =>
        db.booking.findMany({
          where: {
            property: {
              ownerId: user.id,
            },
          },
          include: {
            property: true,
            tenant: {
              select: { email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      );
    } else if (user.role === 'admin') {
      bookings = await withRetry((db) =>
        db.booking.findMany({
          include: {
            property: true,
            tenant: {
              select: { email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      );
    }

    const formattedBookings = bookings.map((b) => ({
      ...b,
      hasReceipt: Boolean(b.receiptImage),
      receiptImage: b.receiptImage ? `/api/bookings/${b.id}/receipt` : null,
    }));

    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    return NextResponse.json({ error: 'Server error loading bookings. Please try again.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user || (user.role !== 'tenant' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized. Tenants and Admins only.' },
        { status: 401 }
      );
    }

    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const property = await withRetry((db) =>
      db.property.findUnique({
        where: { id: propertyId },
      })
    );

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.status === 'taken' || property.status === 'pending') {
      return NextResponse.json(
        { error: property.status === 'taken' ? 'Property is already rented' : 'This property has a pending booking request' },
        { status: 400 }
      );
    }

    // Check if the tenant already has a pending/requested booking on this property
    const existingBooking = await withRetry((db) =>
      db.booking.findFirst({
        where: {
          propertyId,
          tenantId: user.id,
          status: { in: ['requested', 'payment_pending', 'paid'] },
        },
      })
    );

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You already have an active booking request for this property' },
        { status: 400 }
      );
    }

    const booking = await withRetry((db) =>
      db.booking.create({
        data: {
          propertyId,
          tenantId: user.id,
          status: 'requested',
        },
      })
    );

    // Shift property status to pending when booking is requested
    await withRetry((db) =>
      db.property.update({
        where: { id: propertyId },
        data: { status: 'pending' },
      })
    );

    return NextResponse.json(
      { message: 'Booking requested successfully', booking },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Booking Error:', error);
    return NextResponse.json({ error: 'Server error processing booking request.' }, { status: 500 });
  }
}

