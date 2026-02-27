import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, logAuditAction } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { isAllowedDomain } from '@/lib/constants';

const BodySchema = z.object({
  email: z.string().email(),
  role: z.enum(['moderator', 'admin']), // super_admin can only be granted via SQL
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

  const { email, role } = parsed.data;

  // Validate domain
  if (!isAllowedDomain(email)) {
    return NextResponse.json(
      { error: 'User must have a Columbia University email address.' },
      { status: 400 },
    );
  }

  try {
    const service = createSupabaseServiceClient();

    // Look up user by email in auth.users via admin API
    const { data: usersData, error: usersError } = await service.auth.admin.listUsers();
    if (usersError) {
      console.error('[roles/grant] listUsers error:', usersError);
      return NextResponse.json({ error: 'Could not look up user' }, { status: 500 });
    }

    const targetUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'No user found with that email. They must have signed up first.' },
        { status: 404 },
      );
    }

    // Upsert role (replaces existing role if any)
    const { error: roleError } = await service
      .from('user_roles')
      .upsert(
        { user_id: targetUser.id, role, granted_by: actor.id },
        { onConflict: 'user_id' },
      );

    if (roleError) {
      console.error('[roles/grant] upsert error:', roleError);
      return NextResponse.json({ error: 'Database error granting role' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'grant_role',
      targetUserId: targetUser.id,
      targetTable: 'user_roles',
      metadata: { role, email },
    });

    return NextResponse.json({ ok: true, userId: targetUser.id });
  } catch (err) {
    console.error('[roles/grant] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
