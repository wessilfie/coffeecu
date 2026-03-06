import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, logAuditAction } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  email: z.string().email(),
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

  const { email } = parsed.data;

  try {
    const service = createSupabaseServiceClient();

    // Look up user by email
    const { data: usersData, error: usersError } = await service.auth.admin.listUsers();
    if (usersError) {
      console.error('[roles/revoke] listUsers error:', usersError);
      return NextResponse.json({ error: 'Could not look up user' }, { status: 500 });
    }

    const targetUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'No user found with that email.' },
        { status: 404 },
      );
    }

    // Prevent revoking own role
    if (targetUser.id === actor.id) {
      return NextResponse.json(
        { error: 'You cannot revoke your own role.' },
        { status: 400 },
      );
    }

    // Get current role for audit log
    const { data: existing } = await service
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUser.id)
      .single();

    const { error: deleteError } = await service
      .from('user_roles')
      .delete()
      .eq('user_id', targetUser.id);

    if (deleteError) {
      console.error('[roles/revoke] delete error:', deleteError);
      return NextResponse.json({ error: 'Database error revoking role' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'revoke_role',
      targetUserId: targetUser.id,
      targetTable: 'user_roles',
      metadata: { previousRole: existing?.role ?? null, email },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[roles/revoke] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
