export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
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
      bookings = await prisma.booking.findMany({
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
      });
    } else if (user.role === 'landlord') {
      bookings = await prisma.booking.findMany({
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
      });
    } else if (user.role === 'admin') {
      bookings = await prisma.booking.findMany({
        include: {
          property: true,
          tenant: {
            select: { email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user || user.role !== 'tenant') {
      return NextResponse.json(
        { error: 'Unauthorized. Tenants only.' },
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

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

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
    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId,
        tenantId: user.id,
        status: { in: ['requested', 'payment_pending', 'paid'] },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You already have an active booking request for this property' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        tenantId: user.id,
        status: 'requested',
      },
    });

    // Shift property status to pending when booking is requested
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: 'pending' },
    });

    return NextResponse.json(
      { message: 'Booking requested successfully', booking },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Booking Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
