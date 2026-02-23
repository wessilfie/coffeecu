import { createSupabaseServerClient } from '@/lib/supabase/server';
import HomeClient from './HomeClient';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { DEV_BYPASS, DEV_USER, DEV_MOCK_PROFILES } from '@/lib/dev-bypass';
import type { Profile } from '@/types';

// Server component — fetches initial data, then hands off to client
export default async function HomePage() {
  if (DEV_BYPASS) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <HomeClient
          initialProfiles={DEV_MOCK_PROFILES}
          meetingCount={247}
          isLoggedIn={true}
          userId={DEV_USER.id}
        />
        <Footer />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  // Initial profiles (server-rendered for fast FCP + SEO)
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, user_id, name, uni, university, school, year, major, pronouns, about, likes, contact_for, availability, twitter, facebook, linkedin, website, image_url, is_public, random_sort, created_at, updated_at')
    .order('random_sort', { ascending: true })
    .limit(12);

  // Meeting count for the community stats display
  const { count: meetingCount } = await supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true });

  // Auth state (for "Grab Coffee" button gating)
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <HomeClient
        initialProfiles={(profiles ?? []) as Profile[]}
        meetingCount={meetingCount ?? 0}
        isLoggedIn={!!user}
        userId={user?.id ?? null}
      />
      <Footer />
    </div>
  );
}
