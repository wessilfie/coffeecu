import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, logAuditAction } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  userId: z.string().uuid(),
  designation: z.enum(['faculty', 'staff']).nullable(),
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

  const { userId, designation } = parsed.data;

  try {
    const service = createSupabaseServiceClient();

    const { error } = await service
      .from('profiles')
      .update({ designation })
      .eq('user_id', userId);

    if (error) {
      console.error('[set-designation] update error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'set_designation',
      targetUserId: userId,
      targetTable: 'profiles',
      metadata: { designation },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[set-designation] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
