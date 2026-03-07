import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/auth';
import { scanProfile } from '@/lib/content-flags';
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

  // Fetch actively suspended user IDs
  const now = new Date().toISOString();
  const { data: suspensionRows } = await serviceClient
    .from('suspensions')
    .select('user_id')
    .is('lifted_at', null)
    .or(`suspended_until.is.null,suspended_until.gt.${now}`);

  const suspendedUserIds = [...new Set((suspensionRows ?? []).map(r => r.user_id))];

  // Fetch banned user IDs
  const { data: blacklistRows } = await serviceClient
    .from('blacklist')
    .select('user_id');

  const bannedUserIds = (blacklistRows ?? []).map(r => r.user_id);

  // Fetch user roles (for role management in profile detail modal)
  const { data: userRoleRows } = await serviceClient
    .from('user_roles')
    .select('user_id, role');

  const userRoles: Record<string, string> = {};
  for (const row of userRoleRows ?? []) {
    userRoles[row.user_id] = row.role;
  }

  // Fetch already-reviewed profile user IDs (dismissed or actioned — don't re-surface)
  const { data: reviewedRows } = await serviceClient
    .from('moderation_reviews')
    .select('profile_user_id');

  const reviewedUserIds = new Set((reviewedRows ?? []).map(r => r.profile_user_id));

  // Scan profiles for flagged content (server-side, excluded already-reviewed)
  const flaggedProfiles = (profiles ?? [])
    .filter(p => !reviewedUserIds.has(p.user_id))
    .map(p => ({ profile: p, flags: scanProfile(p as FullProfile) }))
    .filter(fp => fp.flags.length > 0);

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
          suspendedUserIds={suspendedUserIds}
          bannedUserIds={bannedUserIds}
          flaggedProfiles={flaggedProfiles}
          userRoles={userRoles}
        />
      </main>
      <Footer />
    </div>
  );
}
