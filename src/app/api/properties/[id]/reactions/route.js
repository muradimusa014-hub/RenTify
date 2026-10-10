export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withRetry } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(request, { params }) {
  try {
    const { id: propertyId } = await params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || '';

    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;
    const userId = user ? user.id : null;

    const [likesCount, dislikesCount, userReactions] = await withRetry((db) =>
      Promise.all([
        db.propertyReaction.count({
          where: { propertyId, type: 'like' },
        }),
        db.propertyReaction.count({
          where: { propertyId, type: 'dislike' },
        }),
        userId || sessionId
          ? db.propertyReaction.findFirst({
              where: {
                propertyId,
                OR: [
                  ...(userId ? [{ userId }] : []),
                  ...(sessionId ? [{ sessionId }] : []),
                ],
              },
            })
          : Promise.resolve(null),
      ])
    );

    return NextResponse.json({
      likes: likesCount,
      dislikes: dislikesCount,
      userReaction: userReactions ? userReactions.type : null,
    });
  } catch (error) {
    console.error('Fetch Reactions Error:', error);
    return NextResponse.json({ likes: 0, dislikes: 0, userReaction: null });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: propertyId } = await params;
    const { type, sessionId: clientSessionId } = await request.json();

    if (!type || !['like', 'dislike'].includes(type)) {
      return NextResponse.json({ error: 'Valid reaction type (like or dislike) is required' }, { status: 400 });
    }

    const tokenCookie = request.cookies.get('rentify_token');
    const token = tokenCookie ? tokenCookie.value : null;
    const user = token ? await verifyToken(token) : null;
    const userId = user ? user.id : null;
    const sessionId = clientSessionId || (tokenCookie ? null : 'guest_' + Math.random().toString(36).slice(2));

    const result = await withRetry(async (db) => {
      // Find existing reaction
      const existing = await db.propertyReaction.findFirst({
        where: {
          propertyId,
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(sessionId ? [{ sessionId }] : []),
          ],
        },
      });

      let nextUserReaction = null;

      if (existing) {
        if (existing.type === type) {
          // Toggle off (User clicked same button again)
          await db.propertyReaction.delete({ where: { id: existing.id } });
          nextUserReaction = null;
        } else {
          // Switch reaction (e.g. dislike to like)
          await db.propertyReaction.update({
            where: { id: existing.id },
            data: { type },
          });
          nextUserReaction = type;
        }
      } else {
        // Create new reaction
        await db.propertyReaction.create({
          data: {
            propertyId,
            userId,
            sessionId: userId ? null : sessionId,
            type,
          },
        });
        nextUserReaction = type;
      }

      const [likes, dislikes] = await Promise.all([
        db.propertyReaction.count({ where: { propertyId, type: 'like' } }),
        db.propertyReaction.count({ where: { propertyId, type: 'dislike' } }),
      ]);

      return { likes, dislikes, userReaction: nextUserReaction, sessionId };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Post Reaction Error:', error);
    return NextResponse.json({ error: 'Failed to record reaction' }, { status: 500 });
  }
}
