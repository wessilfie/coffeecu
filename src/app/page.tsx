import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import HomeClient from './HomeClient';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { DEV_BYPASS, DEV_USER, DEV_MOCK_PROFILES } from '@/lib/dev-bypass';
import type { Profile } from '@/types';

// Server component — fetches initial data, then hands off to client
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string }>;
}) {
  const params = await searchParams;
  const isDevGuest = params.guest === '1';

  const supabase = await createSupabaseServerClient();

  // Auth state (for "Grab Coffee" button gating)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && DEV_BYPASS) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <HomeClient
          initialProfiles={isDevGuest ? [] : DEV_MOCK_PROFILES}
          meetingCount={247}
          isLoggedIn={!isDevGuest}
          userId={isDevGuest ? null : DEV_USER.id}
          sentRequests={[]}
          receivedRequests={[]}
          hasPublishedProfile={!isDevGuest}
        />
        <Footer />
      </div>
    );
  }

  // Initial profiles (server-rendered for fast FCP + SEO)
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, user_id, name, uni, university, school, year, degree, major, clubs, pronouns, responses, twitter, facebook, linkedin, instagram, youtube, tiktok, website, image_url, is_public, random_sort, created_at, updated_at')
    .order('random_sort', { ascending: true })
    .limit(12);

  // Meeting count for the community stats display — uses service client to bypass
  // the meetings_participant_read RLS policy, which would otherwise only count
  // the current user's own meetings (or return 0 for unauthenticated visitors).
  const serviceClient = createSupabaseServiceClient();
  const { count: meetingCount } = await serviceClient
    .from('meetings')
    .select('*', { count: 'exact', head: true });

  // Ensure current user's own profile is always shown, even if random_sort pushes it off page 1
  // Also derive hasPublishedProfile to gate the community grid for draft-only users
  let profileList = (profiles ?? []) as unknown as Profile[];
  let hasPublishedProfile = false;
  if (user) {
    const alreadyInList = profileList.some(p => (p as Profile & { user_id: string }).user_id === user.id);
    if (alreadyInList) {
      hasPublishedProfile = true;
    } else {
      const serviceClient = createSupabaseServiceClient();
      const { data: ownProfile } = await serviceClient
        .from('profiles')
        .select('id, user_id, name, uni, university, school, year, degree, major, clubs, pronouns, responses, twitter, facebook, linkedin, instagram, youtube, tiktok, website, image_url, is_public, random_sort, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('is_public', true)
        .eq('is_visible', true)
        .maybeSingle();
      if (ownProfile) {
        hasPublishedProfile = true;
        profileList = [ownProfile as unknown as Profile, ...profileList];
      }
    }
  }

  // Meetings the current user has already requested (to prevent resends and show dates)
  // Also fetch meetings RECEIVED by the current user to show a reminder UI
  let sentRequests: { id: string; date: string }[] = [];
  let receivedRequests: { id: string; date: string }[] = [];
  if (user) {
    const [sentRes, receivedRes] = await Promise.all([
      supabase.from('meetings').select('receiver_id, created_at').eq('sender_id', user.id),
      supabase.from('meetings').select('sender_id, created_at').eq('receiver_id', user.id),
    ]);

    sentRequests = (sentRes.data ?? []).map((m: { receiver_id: string; created_at: string }) => ({
      id: m.receiver_id,
      date: m.created_at,
    }));

    receivedRequests = (receivedRes.data ?? []).map((m: { sender_id: string; created_at: string }) => ({
      id: m.sender_id,
      date: m.created_at,
    }));
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <HomeClient
        initialProfiles={profileList}
        meetingCount={meetingCount ?? 0}
        isLoggedIn={!!user}
        userId={user?.id ?? null}
        sentRequests={sentRequests}
        receivedRequests={receivedRequests}
        hasPublishedProfile={hasPublishedProfile}
      />
      <Footer />
    </div>
  );
}
