import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, logAuditAction } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  userId: z.string().uuid(),
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

  const { userId } = parsed.data;

  if (userId === actor.id) {
    return NextResponse.json({ error: 'You cannot remove your own profile.' }, { status: 400 });
  }

  try {
    const service = createSupabaseServiceClient();

    const { error: profileError } = await service
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('[remove] profiles delete error:', profileError);
      return NextResponse.json({ error: 'Database error deleting profile' }, { status: 500 });
    }

    const { error: draftError } = await service
      .from('draft_profiles')
      .delete()
      .eq('user_id', userId);

    if (draftError) {
      console.error('[remove] draft_profiles delete error:', draftError);
      return NextResponse.json({ error: 'Database error deleting draft profile' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'remove_profile',
      targetUserId: userId,
      targetTable: 'profiles',
      metadata: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[remove] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
