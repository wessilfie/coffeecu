import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import ProfileForm from './ProfileForm';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { DEV_BYPASS, DEV_USER, DEV_MOCK_FULL_PROFILE, DEV_MOCK_DRAFT } from '@/lib/dev-bypass';
import type { FullProfile, DraftProfile } from '@/types';

// Server component — loads existing profile/draft data
export default async function ProfilePage() {
  let userId: string;
  let userEmail: string;
  let draft: DraftProfile | null;
  let profile: FullProfile | null;

  if (DEV_BYPASS) {
    userId = DEV_USER.id;
    userEmail = DEV_USER.email;
    profile = DEV_MOCK_FULL_PROFILE;
    draft = DEV_MOCK_DRAFT;
  } else {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login?redirect=/profile');

    userId = user.id;
    userEmail = user.email ?? '';

    const serviceClient = createSupabaseServiceClient();

    const [draftRes, profileRes] = await Promise.all([
      serviceClient.from('draft_profiles').select('*').eq('user_id', user.id).single(),
      serviceClient.from('profiles').select('*').eq('user_id', user.id).single(),
    ]);

    draft = draftRes.data as DraftProfile | null;
    profile = profileRes.data as FullProfile | null;
  }

  // Determine profile status
  const status = profile ? 'published'
    : draft ? 'draft'
    : 'new';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main
        style={{
          flex: 1,
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          padding: '2.5rem 1.5rem 4rem',
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Your community profile
          </p>
          <h1
            className="heading-display"
            style={{ fontSize: '2.5rem', color: 'var(--color-ink)', margin: 0 }}
          >
            {status === 'new' ? 'Build your profile' : 'Edit your profile'}
          </h1>
        </div>

        {/* Status banner */}
        {status === 'published' && (
          <div className="status-banner status-published" style={{ marginBottom: '2rem' }}>
            <span>✓</span>
            <span>Your profile is live. Other community members can find and reach out to you.</span>
          </div>
        )}
        {status === 'draft' && (
          <div className="status-banner status-draft" style={{ marginBottom: '2rem' }}>
            <span>○</span>
            <span>
              Your profile is saved as a draft. Upload a photo to publish it to the community.
            </span>
          </div>
        )}
        {status === 'new' && (
          <div className="status-banner status-draft" style={{ marginBottom: '2rem' }}>
            <span>→</span>
            <span>
              Fill out your profile and upload a photo to join the Coffee@CU community.
            </span>
          </div>
        )}

        <ProfileForm
          userId={userId}
          userEmail={userEmail}
          existingProfile={profile}
          existingDraft={draft}
        />
      </main>
      <Footer />
    </div>
  );
}
