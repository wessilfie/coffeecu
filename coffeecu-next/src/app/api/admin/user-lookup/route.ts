import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const SAFE_QUERY = /^[a-zA-Z0-9@._+\-\s]{2,80}$/;

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
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }
  if (!SAFE_QUERY.test(query)) {
    return NextResponse.json({ error: 'Query contains unsupported characters' }, { status: 400 });
  }

  try {
    const service = createSupabaseServiceClient();
    const pattern = `%${query}%`;

    const [profilesByName, profilesByEmail, profilesByUni] = await Promise.all([
      service
        .from('profiles')
        .select('id, user_id, name, uni, email, school, year, image_url, is_visible, created_at')
        .ilike('name', pattern)
        .limit(20),
      service
        .from('profiles')
        .select('id, user_id, name, uni, email, school, year, image_url, is_visible, created_at')
        .ilike('email', pattern)
        .limit(20),
      service
        .from('profiles')
        .select('id, user_id, name, uni, email, school, year, image_url, is_visible, created_at')
        .ilike('uni', pattern)
        .limit(20),
    ]);
    const [draftsByName, draftsByEmail, draftsByUni] = await Promise.all([
      service
        .from('draft_profiles')
        .select('id, user_id, name, uni, email, school, year, image_url, updated_at')
        .ilike('name', pattern)
        .limit(10),
      service
        .from('draft_profiles')
        .select('id, user_id, name, uni, email, school, year, image_url, updated_at')
        .ilike('email', pattern)
        .limit(10),
      service
        .from('draft_profiles')
        .select('id, user_id, name, uni, email, school, year, image_url, updated_at')
        .ilike('uni', pattern)
        .limit(10),
    ]);

    const profileErrors = [profilesByName.error, profilesByEmail.error, profilesByUni.error].filter(Boolean);
    if (profileErrors.length > 0) {
      console.error('[user-lookup] profiles query error:', profileErrors[0]);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    const draftErrors = [draftsByName.error, draftsByEmail.error, draftsByUni.error].filter(Boolean);
    if (draftErrors.length > 0) {
      console.error('[user-lookup] draft_profiles query error:', draftErrors[0]);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    type ProfileRow = NonNullable<typeof profilesByName.data>[number];
    type DraftRow = NonNullable<typeof draftsByName.data>[number];

    const profiles = [
      ...(profilesByName.data ?? []),
      ...(profilesByEmail.data ?? []),
      ...(profilesByUni.data ?? []),
    ].reduce<Record<string, ProfileRow>>((acc, row) => {
      acc[row.user_id] = row;
      return acc;
    }, {});
    const profileList = Object.values(profiles).slice(0, 20);

    const drafts = [
      ...(draftsByName.data ?? []),
      ...(draftsByEmail.data ?? []),
      ...(draftsByUni.data ?? []),
    ].reduce<Record<string, DraftRow>>((acc, row) => {
      acc[row.user_id] = row;
      return acc;
    }, {});
    const draftList = Object.values(drafts).slice(0, 10);

    // For each found user, get their activity stats
    const userIds = [
      ...new Set([
        ...profileList.map((p) => p.user_id),
        ...draftList.map((d) => d.user_id),
      ]),
    ];

    // Get meeting counts for these users
    const { data: meetingsSent } = await service
      .from('meetings')
      .select('sender_id')
      .in('sender_id', userIds);

    const { data: meetingsReceived } = await service
      .from('meetings')
      .select('receiver_id')
      .in('receiver_id', userIds);

    // Get active suspensions
    const { data: suspensions } = await service
      .from('suspensions')
      .select('user_id, suspension_type, suspended_until, reason, created_at')
      .in('user_id', userIds)
      .is('lifted_at', null);

    // Get blacklist status
    const { data: blacklisted } = await service
      .from('blacklist')
      .select('user_id')
      .in('user_id', userIds);

    // Get roles
    const { data: roles } = await service
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    // Build per-user maps
    const sentCounts = (meetingsSent ?? []).reduce<Record<string, number>>((acc, m) => {
      acc[m.sender_id] = (acc[m.sender_id] ?? 0) + 1;
      return acc;
    }, {});

    const receivedCounts = (meetingsReceived ?? []).reduce<Record<string, number>>((acc, m) => {
      acc[m.receiver_id] = (acc[m.receiver_id] ?? 0) + 1;
      return acc;
    }, {});

    const suspensionMap = (suspensions ?? []).reduce<Record<string, unknown>>((acc, s) => {
      acc[s.user_id] = s;
      return acc;
    }, {});

    const blacklistSet = new Set((blacklisted ?? []).map((b) => b.user_id));
    const roleMap = (roles ?? []).reduce<Record<string, string>>((acc, r) => {
      acc[r.user_id] = r.role;
      return acc;
    }, {});

    const results = [
      ...profileList.map((p) => ({
        user_id: p.user_id,
        name: p.name,
        uni: p.uni,
        email: p.email,
        school: p.school,
        year: p.year,
        image_url: p.image_url,
        status: p.is_visible ? 'published' : 'hidden',
        requestsSent: sentCounts[p.user_id] ?? 0,
        requestsReceived: receivedCounts[p.user_id] ?? 0,
        suspension: suspensionMap[p.user_id] ?? null,
        isBlacklisted: blacklistSet.has(p.user_id),
        role: roleMap[p.user_id] ?? null,
        profileId: p.id,
      })),
      // Include draft-only users (not in profiles)
      ...draftList
        .filter((d) => !profileList.some((p) => p.user_id === d.user_id))
        .map((d) => ({
          user_id: d.user_id,
          name: d.name,
          uni: d.uni,
          email: d.email,
          school: d.school,
          year: d.year,
          image_url: d.image_url,
          status: 'draft',
          requestsSent: sentCounts[d.user_id] ?? 0,
          requestsReceived: receivedCounts[d.user_id] ?? 0,
          suspension: suspensionMap[d.user_id] ?? null,
          isBlacklisted: blacklistSet.has(d.user_id),
          role: roleMap[d.user_id] ?? null,
          profileId: null,
        })),
    ];

    return NextResponse.json({ results });
  } catch (err) {
    console.error('[user-lookup] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
