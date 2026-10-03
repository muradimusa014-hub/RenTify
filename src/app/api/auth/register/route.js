export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withRetry } from '@/lib/db';
import { hashPassword } from '@/lib/hash';

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();

    // Validation
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'tenant' && role !== 'landlord') {
      return NextResponse.json(
        { error: 'Invalid role selection' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await withRetry((db) =>
      db.user.findUnique({
        where: { email: cleanEmail },
      })
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password and save
    const hashedPassword = await hashPassword(password);
    const user = await withRetry((db) =>
      db.user.create({
        data: {
          email: cleanEmail,
          passwordHash: hashedPassword,
          role,
        },
      })
    );

    return NextResponse.json(
      { message: 'User registered successfully', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: 'Unable to process registration at this time. Please try again.' },
      { status: 500 }
    );
  }
}

