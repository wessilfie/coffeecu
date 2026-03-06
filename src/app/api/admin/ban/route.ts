import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, logAuditAction } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireRole('admin');
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId, reason } = parsed.data;

  if (userId === actor.id) {
    return NextResponse.json({ error: 'You cannot ban yourself.' }, { status: 400 });
  }

  try {
    const service = createSupabaseServiceClient();

    // Add to blacklist
    const { error: blacklistError } = await service
      .from('blacklist')
      .insert({ user_id: userId, reason, banned_by: actor.id });

    if (blacklistError) {
      console.error('[ban] blacklist insert error:', blacklistError);
      return NextResponse.json({ error: 'Database error inserting blacklist entry' }, { status: 500 });
    }

    // Remove published profile
    const { error: profileError } = await service
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('[ban] profiles delete error:', profileError);
      return NextResponse.json({ error: 'Database error deleting profile' }, { status: 500 });
    }

    // Remove draft profile
    const { error: draftError } = await service
      .from('draft_profiles')
      .delete()
      .eq('user_id', userId);

    if (draftError) {
      console.error('[ban] draft_profiles delete error:', draftError);
      return NextResponse.json({ error: 'Database error deleting draft profile' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'ban_user',
      targetUserId: userId,
      targetTable: 'blacklist',
      metadata: { reason },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ban] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
