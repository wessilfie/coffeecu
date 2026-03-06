import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    await requireRole('moderator');
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const service = createSupabaseServiceClient();

    const { data, error } = await service
      .from('suspensions')
      .select('suspension_type, suspended_until, reason, suspended_by, created_at')
      .eq('user_id', userId)
      .is('lifted_at', null)
      .or('suspended_until.is.null,suspended_until.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[suspensions/status] query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ isSuspended: false, suspendedUntil: null, reason: null });
    }

    return NextResponse.json({
      isSuspended: true,
      suspendedUntil: data.suspended_until ?? null,
      reason: data.reason,
      suspensionType: data.suspension_type,
    });
  } catch (err) {
    console.error('[suspensions/status] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
