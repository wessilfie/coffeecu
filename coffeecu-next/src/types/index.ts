// ============================================================
// Coffee@CU — TypeScript Types
// Mirrors the Supabase schema exactly
// ============================================================

export type School = 'CC' | 'SEAS' | 'GS' | 'BC' | 'GR';
export type UserRole = 'moderator' | 'admin' | 'super_admin';
export type SuspensionType = 'temporary' | 'indefinite';

// Public-safe profile (no email/phone — matches public_profiles view)
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  uni: string | null;
  university: string;
  school: School | null;
  year: string | null;
  major: string[];
  pronouns: string | null;
  about: string | null;
  likes: string | null;
  contact_for: string | null;
  availability: string | null;
  twitter: string | null;
  facebook: string | null;
  linkedin: string | null;
  website: string | null;
  image_url: string;
  is_public: boolean;
  random_sort: number;
  created_at: string;
  updated_at: string;
}

// Full profile (includes PII — only for owner/service role)
export interface FullProfile extends Profile {
  email: string | null;
  phone: string | null;
  is_visible: boolean;
}

// Draft profile (in-progress, not yet published)
export interface DraftProfile {
  id: string;
  user_id: string;
  name: string | null;
  uni: string | null;
  university: string;
  email: string | null;
  phone: string | null;
  school: School | null;
  year: string | null;
  major: string[];
  pronouns: string | null;
  about: string | null;
  likes: string | null;
  contact_for: string | null;
  availability: string | null;
  twitter: string | null;
  facebook: string | null;
  linkedin: string | null;
  website: string | null;
  image_url: string | null;
  is_public: boolean;
  updated_at: string;
}

export interface Meeting {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  created_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by: string | null;
  created_at: string;
}

export interface Suspension {
  id: string;
  user_id: string;
  suspension_type: SuspensionType;
  reason: string | null;
  suspended_until: string | null;
  suspended_by: string;
  lifted_at: string | null;
  lifted_by: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  target_user_id: string | null;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Profile form data (used in react-hook-form)
export interface ProfileFormData {
  name: string;
  school: School | '';
  year: string;
  major: string[];
  pronouns: string;
  about: string;
  likes: string;
  contact_for: string;
  availability: string;
  twitter: string;
  facebook: string;
  linkedin: string;
  website: string;
  phone: string;
  is_public: boolean;
}

// Filter state for home page search
export interface ProfileFilters {
  query: string;
  year: string;
  school: string;
  major: string;
}

// Admin user lookup result
export interface AdminUserInfo {
  profile: FullProfile | null;
  draft: DraftProfile | null;
  meetingsSent: Meeting[];
  meetingsReceived: Meeting[];
  role: UserRoleRecord | null;
  suspension: Suspension | null;
  isBlacklisted: boolean;
}

// Atomic coffee request result
export type CoffeeRequestResult =
  | 'ok'
  | 'self_request'
  | 'blacklisted'
  | 'suspended'
  | 'rate_limited'
  | 'duplicate'
  | 'error';
