import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    await requireRole('super_admin');
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  try {
    const service = createSupabaseServiceClient();

    const { data, error, count } = await service
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[audit-log] query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const entries = data ?? [];

    // Collect unique user IDs to resolve names in one query
    const userIds = new Set<string>();
    for (const e of entries) {
      if (e.actor_id) userIds.add(e.actor_id);
      if (e.target_user_id) userIds.add(e.target_user_id);
    }

    let nameMap: Record<string, string> = {};
    if (userIds.size > 0) {
      const { data: profileRows } = await service
        .from('profiles')
        .select('user_id, name')
        .in('user_id', [...userIds]);
      if (profileRows) {
        for (const row of profileRows) {
          nameMap[row.user_id] = row.name;
        }
      }
    }

    const enriched = entries.map(e => ({
      ...e,
      actor_name: e.actor_id ? (nameMap[e.actor_id] ?? null) : null,
      target_name: e.target_user_id ? (nameMap[e.target_user_id] ?? null) : null,
    }));

    return NextResponse.json({ entries: enriched, total: count ?? 0 });
  } catch (err) {
    console.error('[audit-log] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
