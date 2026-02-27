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

  try {
    const service = createSupabaseServiceClient();

    // 1. Delete all storage files for this user
    const { data: storageFiles } = await service.storage
      .from('profile-photos')
      .list(`profiles/${userId}`);

    if (storageFiles && storageFiles.length > 0) {
      const paths = storageFiles.map(f => `profiles/${userId}/${f.name}`);
      const { error: storageError } = await service.storage
        .from('profile-photos')
        .remove(paths);
      if (storageError) {
        console.error('[delete-account] Storage delete error:', storageError);
        // Non-fatal — proceed with account deletion
      }
    }

    // 2. Delete auth user — cascades to profiles, draft_profiles, meetings via ON DELETE CASCADE
    const { error: authError } = await service.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('[delete-account] auth.admin.deleteUser error:', authError);
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
    }

    await logAuditAction({
      actorId: actor.id,
      action: 'delete_account',
      targetUserId: userId,
      targetTable: 'auth.users',
      metadata: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[delete-account] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
