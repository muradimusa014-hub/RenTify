export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withRetry } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(request, { params }) {
  try {
    const { id: propertyId } = await params;

    const comments = await withRetry((db) =>
      db.comment.findMany({
        where: { propertyId },
        select: {
          id: true,
          authorName: true,
          authorRole: true,
          content: true,
          createdAt: true,
          userId: true,
        },
        orderBy: { createdAt: 'asc' },
      })
    );

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Fetch Comments Error:', error);
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: propertyId } = await params;
    const { content, authorName: clientAuthorName } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Question / comment content cannot be empty' }, { status: 400 });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 1000) {
      return NextResponse.json({ error: 'Comment must be under 1000 characters' }, { status: 400 });
    }

    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;

    let authorName = 'Student';
    let authorRole = 'tenant';
    let userId = null;

    if (user) {
      userId = user.id;
      authorRole = user.role;
      authorName = clientAuthorName?.trim() || user.email.split('@')[0];
    } else {
      authorName = clientAuthorName?.trim() || 'Student';
      authorRole = 'guest';
    }

    const comment = await withRetry((db) =>
      db.comment.create({
        data: {
          propertyId,
          userId,
          authorName,
          authorRole,
          content: trimmedContent,
        },
        select: {
          id: true,
          authorName: true,
          authorRole: true,
          content: true,
          createdAt: true,
          userId: true,
        },
      })
    );

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Create Comment Error:', error);
    return NextResponse.json({ error: 'Failed to post question / comment' }, { status: 500 });
  }
}
