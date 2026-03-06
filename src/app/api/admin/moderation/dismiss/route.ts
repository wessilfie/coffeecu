import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, logAuditAction } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  profileUserId: z.string().uuid(),
  verdict: z.enum(['dismissed', 'actioned']),
  flaggedTerms: z.array(z.string()),
  flaggedFields: z.array(z.string()),
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

  const { profileUserId, verdict, flaggedTerms, flaggedFields } = parsed.data;

  try {
    const service = createSupabaseServiceClient();

    const { error } = await service.from('moderation_reviews').insert({
      profile_user_id: profileUserId,
      reviewed_by: actor.id,
      verdict,
      flagged_terms: flaggedTerms,
      flagged_fields: flaggedFields,
    });

    if (error) {
      console.error('[moderation/dismiss] insert error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: verdict === 'dismissed' ? 'dismiss_flag' : 'action_flag',
      targetUserId: profileUserId,
      targetTable: 'moderation_reviews',
      metadata: { flaggedTerms, flaggedFields },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[moderation/dismiss] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
