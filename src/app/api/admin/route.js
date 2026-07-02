import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { deleteFile } from '@/lib/upload';

export async function GET(request) {
  try {
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admins only.' },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const properties = await prisma.property.findMany({
      include: {
        owner: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const bookings = await prisma.booking.findMany({
      include: {
        property: true,
        tenant: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users, properties, bookings });
  } catch (error) {
    console.error('Fetch Admin Data Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admins only.' },
        { status: 401 }
      );
    }

    const { action, bookingId, propertyId, userId } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'approve_payment') {
      if (!bookingId) {
        return NextResponse.json(
          { error: 'Booking ID is required' },
          { status: 400 }
        );
      }
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'paid' },
      });
      return NextResponse.json({
        message: 'Payment approved successfully',
        booking,
      });
    }

    if (action === 'reject_payment') {
      if (!bookingId) {
        return NextResponse.json(
          { error: 'Booking ID is required' },
          { status: 400 }
        );
      }
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'rejected' },
        include: { property: true },
      });
      // Revert property status back to available
      await prisma.property.update({
        where: { id: booking.propertyId },
        data: { status: 'available' },
      });
      return NextResponse.json({
        message: 'Payment rejected and property set back to available',
        booking,
      });
    }

    if (action === 'complete_booking') {
      if (!bookingId) {
        return NextResponse.json(
          { error: 'Booking ID is required' },
          { status: 400 }
        );
      }
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'completed' },
        include: { property: true },
      });
      // Update property status to taken
      await prisma.property.update({
        where: { id: booking.propertyId },
        data: { status: 'taken' },
      });
      return NextResponse.json({
        message: 'Booking marked as completed. Property is now taken.',
        booking,
      });
    }

    if (action === 'flag_property') {
      if (!propertyId) {
        return NextResponse.json(
          { error: 'Property ID is required' },
          { status: 400 }
        );
      }
      const property = await prisma.property.update({
        where: { id: propertyId },
        data: { isSuspicious: true },
      });
      return NextResponse.json({
        message: 'Property flagged as suspicious',
        property,
      });
    }

    if (action === 'unflag_property') {
      if (!propertyId) {
        return NextResponse.json(
          { error: 'Property ID is required' },
          { status: 400 }
        );
      }
      const property = await prisma.property.update({
        where: { id: propertyId },
        data: { isSuspicious: false },
      });
      return NextResponse.json({
        message: 'Property unflagged successfully',
        property,
      });
    }

    if (action === 'delete_property') {
      if (!propertyId) {
        return NextResponse.json(
          { error: 'Property ID is required' },
          { status: 400 }
        );
      }
      const targetProperty = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { images: true },
      });

      if (targetProperty) {
        for (const imagePath of targetProperty.images.split(',')) {
          await deleteFile(imagePath);
        }

        const relatedBookings = await prisma.booking.findMany({
          where: { propertyId },
          select: { receiptImage: true },
        });

        for (const booking of relatedBookings) {
          if (booking.receiptImage) {
            await deleteFile(booking.receiptImage);
          }
        }
      }

      await prisma.property.delete({
        where: { id: propertyId },
      });
      return NextResponse.json({ message: 'Property deleted successfully' });
    }

    if (action === 'delete_user') {
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }
      if (userId === user.id) {
        return NextResponse.json(
          { error: 'Cannot delete yourself' },
          { status: 400 }
        );
      }

      const userProperties = await prisma.property.findMany({
        where: { ownerId: userId },
        select: { images: true },
      });

      for (const property of userProperties) {
        for (const imagePath of property.images.split(',')) {
          await deleteFile(imagePath);
        }
      }

      const userBookings = await prisma.booking.findMany({
        where: { tenantId: userId },
        select: { receiptImage: true },
      });

      for (const booking of userBookings) {
        if (booking.receiptImage) {
          await deleteFile(booking.receiptImage);
        }
      }

      await prisma.user.delete({
        where: { id: userId },
      });
      return NextResponse.json({ message: 'User deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin Action Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
