import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { saveFile } from '@/lib/upload';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const minPrice = parseFloat(searchParams.get('minPrice'));
    const maxPrice = parseFloat(searchParams.get('maxPrice'));
    const ownerId = searchParams.get('ownerId');

    const filter = {
      isSuspicious: false, // Don't show flagged properties
    };

    if (location) {
      filter.location = location;
    }

    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      filter.price = {};
      if (!isNaN(minPrice)) filter.price.gte = minPrice;
      if (!isNaN(maxPrice)) filter.price.lte = maxPrice;
    }

    if (ownerId) {
      filter.ownerId = ownerId;
      // Landlords can view their own flagged listings
      delete filter.isSuspicious;
    }

    const properties = await prisma.property.findMany({
      where: filter,
      include: {
        owner: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Fetch Properties Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    if (!user || user.role !== 'landlord') {
      return NextResponse.json(
        { error: 'Unauthorized. Landlords only.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const price = parseFloat(formData.get('price'));
    const location = formData.get('location');

    if (!title || !description || isNaN(price) || !location) {
      return NextResponse.json(
        { error: 'Title, description, price, and location are required' },
        { status: 400 }
      );
    }

    const files = formData.getAll('images');
    const savedImages = [];

    for (const file of files) {
      if (file && file.size > 0) {
        const savedPath = await saveFile(file, 'properties');
        if (savedPath) {
          savedImages.push(savedPath);
        }
      }
    }

    if (savedImages.length === 0) {
      return NextResponse.json(
        { error: 'At least one property image is required' },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        price,
        location,
        status: 'available',
        images: savedImages.join(','),
        ownerId: user.id,
      },
    });

    return NextResponse.json(
      { message: 'Property listed successfully', property },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Property Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
