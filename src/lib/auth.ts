import 'server-only';

import { createSupabaseServerClient, createSupabaseServiceClient } from './supabase/server';
import type { UserRole } from '@/types';
import { DEV_BYPASS } from './dev-bypass';

// ============================================================
// Auth utilities — all server-only
// ============================================================

// Get the current authenticated user (from session cookie)
// Returns null if not authenticated
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// Check if a user has a specific role or higher
// Role hierarchy: super_admin > admin > moderator
const ROLE_HIERARCHY: Record<UserRole, number> = {
  moderator: 1,
  admin: 2,
  super_admin: 3,
};

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const serviceClient = createSupabaseServiceClient();
  const { data } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  return (data?.role as UserRole) ?? null;
}

export async function hasRole(userId: string, requiredRole: UserRole): Promise<boolean> {
  if (DEV_BYPASS) return true;

  const role = await getUserRole(userId);
  if (!role) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}

// Require authentication — throws if not authenticated
// Use in API routes
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

// Require a minimum role — throws if insufficient permissions
export async function requireRole(minRole: UserRole) {
  const user = await requireAuth();
  const allowed = await hasRole(user.id, minRole);
  if (!allowed) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

// Log an admin action to the audit log
export async function logAuditAction(params: {
  actorId: string;
  action: string;
  targetUserId?: string;
  targetTable?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const serviceClient = createSupabaseServiceClient();
  await serviceClient.from('audit_log').insert({
    actor_id: params.actorId,
    action: params.action,
    target_user_id: params.targetUserId ?? null,
    target_table: params.targetTable ?? null,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });
}
