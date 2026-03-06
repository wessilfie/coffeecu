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
    actor = await requireRole('moderator');
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

  try {
    const service = createSupabaseServiceClient();

    const { error: liftError } = await service
      .from('suspensions')
      .update({ lifted_at: new Date().toISOString(), lifted_by: actor.id })
      .eq('user_id', userId)
      .is('lifted_at', null);

    if (liftError) {
      console.error('[suspensions/lift] update error:', liftError);
      return NextResponse.json({ error: 'Database error lifting suspension' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'lift_suspension',
      targetUserId: userId,
      targetTable: 'suspensions',
      metadata: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[suspensions/lift] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
