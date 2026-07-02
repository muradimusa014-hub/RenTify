export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { saveFile, deleteFile } from '@/lib/upload';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: { email: true },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error('Fetch Property Detail Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user || user.role !== 'landlord') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You do not own this property.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const price = parseFloat(formData.get('price'));
    const location = formData.get('location');
    const status = formData.get('status');

    let imagesList = property.images.split(',');

    const files = formData.getAll('images');
    const newSavedImages = [];

    for (const file of files) {
      if (file && file.size > 0) {
        const savedPath = await saveFile(file, 'properties');
        if (savedPath) {
          newSavedImages.push(savedPath);
        }
      }
    }

    if (newSavedImages.length > 0) {
      for (const oldImage of imagesList) {
        await deleteFile(oldImage);
      }
      imagesList = newSavedImages;
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        title: title || property.title,
        description: description || property.description,
        price: isNaN(price) ? property.price : price,
        location: location || property.location,
        status: status || property.status,
        images: imagesList.join(','),
      },
    });

    return NextResponse.json({
      message: 'Property updated successfully',
      property: updatedProperty,
    });
  } catch (error) {
    console.error('Update Property Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.ownerId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    for (const imagePath of property.images.split(',')) {
      await deleteFile(imagePath);
    }

    const relatedBookings = await prisma.booking.findMany({
      where: { propertyId: id },
      select: { receiptImage: true },
    });

    for (const booking of relatedBookings) {
      if (booking.receiptImage) {
        await deleteFile(booking.receiptImage);
      }
    }

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete Property Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
