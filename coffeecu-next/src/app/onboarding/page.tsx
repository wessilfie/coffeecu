import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import OnboardingClient from './OnboardingClient';
import { DEV_BYPASS, DEV_USER } from '@/lib/dev-bypass';
import type { DraftProfile } from '@/types';

// Server component — guards auth and loads any existing draft for resumption
export default async function OnboardingPage() {
  if (DEV_BYPASS) {
    return <OnboardingClient userId={DEV_USER.id} userEmail={DEV_USER.email} initialDraft={null} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/onboarding');

  const serviceClient = createSupabaseServiceClient();
  const [draftRes, profileRes] = await Promise.all([
    serviceClient
      .from('draft_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    serviceClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  // Published users don't need onboarding
  if (profileRes.data) redirect('/profile');

  const draft = draftRes.data as DraftProfile | null;
  return <OnboardingClient userId={user.id} userEmail={user.email ?? ''} initialDraft={draft} />;
}
