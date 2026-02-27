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
    actor = await requireRole('super_admin');
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

  // Prevent revoking own role
  if (userId === actor.id) {
    return NextResponse.json(
      { error: 'You cannot revoke your own role.' },
      { status: 400 },
    );
  }

  try {
    const service = createSupabaseServiceClient();

    // Get current role for audit log
    const { data: existing } = await service
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const { error: deleteError } = await service
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[roles/revoke] delete error:', deleteError);
      return NextResponse.json({ error: 'Database error revoking role' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'revoke_role',
      targetUserId: userId,
      targetTable: 'user_roles',
      metadata: { previousRole: existing?.role ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[roles/revoke] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
