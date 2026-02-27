import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, logAuditAction } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  profileId: z.string().uuid(),
  isVisible: z.boolean(),
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

  const { profileId, isVisible } = parsed.data;

  try {
    const service = createSupabaseServiceClient();

    const { error } = await service
      .from('profiles')
      .update({ is_visible: isVisible })
      .eq('id', profileId);

    if (error) {
      console.error('[toggle-visible] DB error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'toggle_profile_visible',
      targetTable: 'profiles',
      targetId: profileId,
      metadata: { isVisible },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[toggle-visible] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
