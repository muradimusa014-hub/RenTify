export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/hash';

export async function GET() {
  return handleAdminSetup();
}

export async function POST() {
  return handleAdminSetup();
}

async function handleAdminSetup() {
  try {
    const adminEmail = 'muradimusa014@gmail.com';
    const defaultAdminPass = 'AdminPass123!';

    let user = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (user) {
      if (user.role !== 'admin') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'admin' },
        });
        return NextResponse.json({
          message: `User ${adminEmail} successfully upgraded to admin role.`,
          user: { id: user.id, email: user.email, role: user.role },
        });
      }
      return NextResponse.json({
        message: `User ${adminEmail} is already an admin.`,
        user: { id: user.id, email: user.email, role: user.role },
      });
    }

    // User does not exist, create admin account
    const passwordHash = await hashPassword(defaultAdminPass);
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'admin',
      },
    });

    return NextResponse.json({
      message: `Admin account created successfully for ${adminEmail}. Default password: ${defaultAdminPass}`,
      user: { id: user.id, email: user.email, role: user.role },
      note: 'Please log in with this email and change your password after initial login.',
    });
  } catch (error) {
    console.error('Admin Setup Error:', error);
    return NextResponse.json(
      { error: 'Failed to setup admin account', details: error.message },
      { status: 500 }
    );
  }
}
