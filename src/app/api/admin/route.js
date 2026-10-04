export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withRetry } from '@/lib/db';
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

    const users = await withRetry((db) =>
      db.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    );

    const properties = await withRetry((db) =>
      db.property.findMany({
        include: {
          owner: {
            select: { email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    );

    const rawBookings = await withRetry((db) =>
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

    // Map bookings so heavy base64 images do not bloat payload or time out serverless functions
    const bookings = rawBookings.map((b) => ({
      ...b,
      hasReceipt: Boolean(b.receiptImage),
      receiptImage: b.receiptImage ? `/api/bookings/${b.id}/receipt` : null,
    }));

    return NextResponse.json({ users, properties, bookings });
  } catch (error) {
    console.error('Fetch Admin Data Error:', error);
    return NextResponse.json({ error: 'Server error loading admin data. Please try again.' }, { status: 500 });
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
      const booking = await withRetry((db) =>
        db.booking.update({
          where: { id: bookingId },
          data: { status: 'paid' },
        })
      );
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
      const booking = await withRetry((db) =>
        db.booking.update({
          where: { id: bookingId },
          data: { status: 'rejected' },
          include: { property: true },
        })
      );
      // Revert property status back to available
      await withRetry((db) =>
        db.property.update({
          where: { id: booking.propertyId },
          data: { status: 'available' },
        })
      );
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
      const booking = await withRetry((db) =>
        db.booking.update({
          where: { id: bookingId },
          data: { status: 'completed' },
          include: { property: true },
        })
      );
      // Update property status to taken
      await withRetry((db) =>
        db.property.update({
          where: { id: booking.propertyId },
          data: { status: 'taken' },
        })
      );
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
      const property = await withRetry((db) =>
        db.property.update({
          where: { id: propertyId },
          data: { isSuspicious: true },
        })
      );
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
      const property = await withRetry((db) =>
        db.property.update({
          where: { id: propertyId },
          data: { isSuspicious: false },
        })
      );
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
      const targetProperty = await withRetry((db) =>
        db.property.findUnique({
          where: { id: propertyId },
          select: { images: true },
        })
      );

      if (targetProperty) {
        for (const imagePath of targetProperty.images.split(',')) {
          await deleteFile(imagePath);
        }

        const relatedBookings = await withRetry((db) =>
          db.booking.findMany({
            where: { propertyId },
            select: { receiptImage: true },
          })
        );

        for (const booking of relatedBookings) {
          if (booking.receiptImage) {
            await deleteFile(booking.receiptImage);
          }
        }
      }

      await withRetry((db) =>
        db.property.delete({
          where: { id: propertyId },
        })
      );
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

      const userProperties = await withRetry((db) =>
        db.property.findMany({
          where: { ownerId: userId },
          select: { images: true },
        })
      );

      for (const property of userProperties) {
        for (const imagePath of property.images.split(',')) {
          await deleteFile(imagePath);
        }
      }

      const userBookings = await withRetry((db) =>
        db.booking.findMany({
          where: { tenantId: userId },
          select: { receiptImage: true },
        })
      );

      for (const booking of userBookings) {
        if (booking.receiptImage) {
          await deleteFile(booking.receiptImage);
        }
      }

      await withRetry((db) =>
        db.user.delete({
          where: { id: userId },
        })
      );
      return NextResponse.json({ message: 'User deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin Action Error:', error);
    return NextResponse.json({ error: 'Server error processing action. Please try again.' }, { status: 500 });
  }
}

