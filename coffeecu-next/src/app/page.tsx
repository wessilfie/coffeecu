import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import HomeClient from './HomeClient';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { DEV_BYPASS, DEV_USER, DEV_MOCK_PROFILES } from '@/lib/dev-bypass';
import { getViewerCommunities } from '@/lib/constants';
import type { Profile } from '@/types';

// Server component — fetches initial data, then hands off to client
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string; community?: string }>;
}) {
  const params = await searchParams;
  const isDevGuest = params.guest === '1';

  if (DEV_BYPASS) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <HomeClient
          initialProfiles={isDevGuest ? [] : DEV_MOCK_PROFILES}
          meetingCount={247}
          isLoggedIn={!isDevGuest}
          userId={isDevGuest ? null : DEV_USER.id}
          sentRequestIds={[]}
          hasPublishedProfile={!isDevGuest}
          activeCommunity="columbia"
          viewerSchool={null}
        />
        <Footer />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const serviceClient = createSupabaseServiceClient();

  // Auth state first (needed for community entitlement check)
  const { data: { user } } = await supabase.auth.getUser();

  // Community entitlement: validate ?community= against the viewer's school
  let viewerSchool: string | null = null;
  if (user) {
    const { data: viewerProfile } = await serviceClient
      .from('profiles')
      .select('school')
      .eq('user_id', user.id)
      .maybeSingle();
    viewerSchool = viewerProfile?.school ?? null;
  }

  const requestedCommunity = params.community ?? 'columbia';
  const entitledCommunities = getViewerCommunities(viewerSchool);
  // Fall back to university-wide if the viewer isn't entitled to the requested community
  const activeCommunity = entitledCommunities.includes(requestedCommunity)
    ? requestedCommunity
    : 'columbia';

  // Initial profiles (server-rendered for fast FCP + SEO)
  // Filtered by the active community scope
  const profileSelect = 'id, user_id, name, uni, university, school, year, degree, major, pronouns, responses, twitter, facebook, linkedin, instagram, youtube, tiktok, website, image_url, is_public, visible_in, random_sort, created_at, updated_at';

  const { data: profiles } = await supabase
    .from('public_profiles')
    .select(profileSelect)
    .contains('visible_in', [activeCommunity])
    .order('random_sort', { ascending: true })
    .limit(12);

  // Meeting count for the community stats display
  const { count: meetingCount } = await supabase
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
      const { data: ownProfile } = await serviceClient
        .from('profiles')
        .select(profileSelect)
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

  // IDs of profiles the current user has already requested (to prevent resends)
  let sentRequestIds: string[] = [];
  if (user) {
    const { data: sentMeetings } = await supabase
      .from('meetings')
      .select('receiver_id')
      .eq('sender_id', user.id);
    sentRequestIds = (sentMeetings ?? []).map((m: { receiver_id: string }) => m.receiver_id);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <HomeClient
        initialProfiles={profileList}
        meetingCount={meetingCount ?? 0}
        isLoggedIn={!!user}
        userId={user?.id ?? null}
        sentRequestIds={sentRequestIds}
        hasPublishedProfile={hasPublishedProfile}
        activeCommunity={activeCommunity}
        viewerSchool={viewerSchool}
      />
      <Footer />
    </div>
  );
}
