import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/auth';
import AdminClient from './AdminClient';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import type { FullProfile, UserRoleRecord } from '@/types';

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/admin');

  // Role check — must be moderator or higher
  const isMod = await hasRole(user.id, 'moderator');
  if (!isMod) redirect('/');

  const [isAdmin, isSuperAdmin] = await Promise.all([
    hasRole(user.id, 'admin'),
    hasRole(user.id, 'super_admin'),
  ]);

  const serviceClient = createSupabaseServiceClient();

  // Fetch all profiles (including hidden ones)
  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Moderator'} Panel
          </p>
          <h1 className="heading-display" style={{ fontSize: '2.25rem', color: 'var(--color-ink)', margin: 0 }}>
            Community Moderation
          </h1>
        </div>

        <AdminClient
          currentUserId={user.id}
          profiles={(profiles ?? []) as FullProfile[]}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
        />
      </main>
      <Footer />
    </div>
  );
}
