import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, logAuditAction } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  userId: z.string().uuid(),
  // ISO 8601 string or null — null means indefinite suspension
  suspendedUntil: z.string().datetime({ offset: true }).nullable().optional(),
  reason: z.string().min(1).max(1000),
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

  const { userId, suspendedUntil, reason } = parsed.data;
  const suspensionType = suspendedUntil ? 'temporary' : 'indefinite';

  try {
    const service = createSupabaseServiceClient();

    const { error: suspendError } = await service
      .from('suspensions')
      .insert({
        user_id: userId,
        suspension_type: suspensionType,
        suspended_until: suspendedUntil ?? null,
        reason,
        suspended_by: actor.id,
      });

    if (suspendError) {
      console.error('[suspend] suspensions insert error:', suspendError);
      return NextResponse.json({ error: 'Database error inserting suspension' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'suspend_user',
      targetUserId: userId,
      targetTable: 'suspensions',
      metadata: { suspensionType, suspendedUntil: suspendedUntil ?? null, reason },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[suspend] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
