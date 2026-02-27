import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import ProfilePageClient from './ProfilePageClient';
import type { Profile } from '@/types';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/columbia/${userId}`);
  }

  const serviceClient = createSupabaseServiceClient();
  const { data: profile } = await serviceClient
    .from('public_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  return <ProfilePageClient profile={profile as Profile} currentUserId={user.id} />;
}
