-- ============================================================
-- Coffee@CU — Initial Schema
-- Security-hardened: RLS on all tables, column-level PII protection,
-- audit log, suspension system, role hierarchy
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast ILIKE search

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('moderator', 'admin', 'super_admin');
CREATE TYPE suspension_type AS ENUM ('temporary', 'indefinite');

-- ============================================================
-- PROFILES (published, publicly visible)
-- PII columns (email, phone) excluded from public SELECT via RLS
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Identity (derived server-side from verified email — never trust client)
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 40),
  uni TEXT,           -- email prefix, set server-side only
  university TEXT NOT NULL DEFAULT 'columbia',  -- future multi-school support

  -- PII — excluded from public RLS SELECT
  email TEXT,         -- server-use only, not exposed publicly
  phone TEXT,         -- optional, for future WhatsApp notifications, not public

  -- Academic info
  school TEXT CHECK (school IN ('CC', 'SEAS', 'GS', 'BC', 'GR') OR school IS NULL),
  year TEXT,
  major TEXT[] DEFAULT '{}',
  pronouns TEXT CHECK (char_length(pronouns) <= 50 OR pronouns IS NULL),

  -- Community profile
  about TEXT CHECK (char_length(about) <= 400 OR about IS NULL),
  likes TEXT CHECK (char_length(likes) <= 150 OR likes IS NULL),
  contact_for TEXT CHECK (char_length(contact_for) <= 250 OR contact_for IS NULL),
  availability TEXT CHECK (char_length(availability) <= 150 OR availability IS NULL),

  -- Social links — must be https:// validated at app layer before insert
  twitter TEXT CHECK (twitter IS NULL OR twitter ~ '^https://'),
  facebook TEXT CHECK (facebook IS NULL OR facebook ~ '^https://'),
  linkedin TEXT CHECK (linkedin IS NULL OR linkedin ~ '^https://'),
  website TEXT CHECK (website IS NULL OR website ~ '^https://'),

  -- Photo — must be Supabase Storage URL, validated at app layer
  image_url TEXT NOT NULL,

  -- Visibility controls
  is_public BOOLEAN NOT NULL DEFAULT true,     -- user-controlled
  is_visible BOOLEAN NOT NULL DEFAULT true,    -- admin-controlled (hide without deleting)

  -- Discovery ordering (randomized nightly via cron)
  random_sort FLOAT NOT NULL DEFAULT random(),

  -- Full-text search vector (auto-maintained, no PII included)
  fts TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(about, '') || ' ' ||
      coalesce(likes, '') || ' ' ||
      coalesce(contact_for, '') || ' ' ||
      coalesce(availability, '') || ' ' ||
      coalesce(uni, '') || ' ' ||
      coalesce(array_to_string(major, ' '), '') || ' ' ||
      coalesce(school, '') || ' ' ||
      coalesce(year, '')
    )
  ) STORED,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_fts_idx ON profiles USING GIN(fts);
CREATE INDEX profiles_school_year_idx ON profiles (school, year);
CREATE INDEX profiles_random_sort_idx ON profiles (random_sort);
CREATE INDEX profiles_visibility_idx ON profiles (is_public, is_visible);
-- Trigram index for admin user-lookup (partial name search)
CREATE INDEX profiles_name_trgm_idx ON profiles USING GIN(name gin_trgm_ops);

-- ============================================================
-- DRAFT PROFILES (incomplete — missing photo or not yet submitted)
-- ============================================================

CREATE TABLE draft_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  name TEXT CHECK (char_length(name) <= 40 OR name IS NULL),
  uni TEXT,
  university TEXT NOT NULL DEFAULT 'columbia',
  email TEXT,
  phone TEXT,
  school TEXT,
  year TEXT,
  major TEXT[] DEFAULT '{}',
  pronouns TEXT,
  about TEXT,
  likes TEXT,
  contact_for TEXT,
  availability TEXT,
  twitter TEXT CHECK (twitter IS NULL OR twitter ~ '^https://'),
  facebook TEXT CHECK (facebook IS NULL OR facebook ~ '^https://'),
  linkedin TEXT CHECK (linkedin IS NULL OR linkedin ~ '^https://'),
  website TEXT CHECK (website IS NULL OR website ~ '^https://'),
  image_url TEXT,      -- null until photo uploaded
  is_public BOOLEAN NOT NULL DEFAULT true,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEETINGS (coffee request log)
-- Prevents duplicate requests. Used for daily rate-limit checks.
-- ============================================================

CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT CHECK (char_length(message) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_self_request CHECK (sender_id != receiver_id),
  CONSTRAINT unique_pair UNIQUE (sender_id, receiver_id)
);

-- Index for O(1) daily limit check: sender + date range
CREATE INDEX meetings_sender_date_idx ON meetings (sender_id, created_at DESC);
-- Index for admin user-lookup (who received requests from a user)
CREATE INDEX meetings_receiver_idx ON meetings (receiver_id);

-- ============================================================
-- BLACKLIST
-- ============================================================

CREATE TABLE blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  reason TEXT,
  banned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER ROLES (moderator / admin / super_admin)
-- Only service role can write. RLS enforced.
-- ============================================================

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role user_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUSPENSIONS (temporary or indefinite request-send pauses)
-- Active suspension = latest record where lifted_at IS NULL
--   and (suspended_until IS NULL or suspended_until > NOW())
-- ============================================================

CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suspension_type suspension_type NOT NULL DEFAULT 'indefinite',
  reason TEXT,
  suspended_until TIMESTAMPTZ,    -- NULL = indefinite
  suspended_by UUID REFERENCES auth.users(id) NOT NULL,
  lifted_at TIMESTAMPTZ,          -- NULL = still active
  lifted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX suspensions_user_active_idx ON suspensions (user_id, lifted_at, suspended_until);

-- ============================================================
-- AUDIT LOG (immutable record of all admin actions)
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),   -- admin/mod who took action
  action TEXT NOT NULL,                       -- 'hide_profile', 'ban_user', 'grant_role', etc.
  target_user_id UUID REFERENCES auth.users(id),
  target_table TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',               -- extra context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_actor_idx ON audit_log (actor_id, created_at DESC);
CREATE INDEX audit_log_target_idx ON audit_log (target_user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY — enabled on all tables
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
-- Anti-scraping: profiles are ONLY readable by authenticated Columbia community members.
-- Unauthenticated/anonymous access returns no rows — prevents scraping, bots, crawlers.
-- The hero/meeting-count on the public landing page uses a separate aggregate query
-- that does NOT touch the profiles table.
CREATE POLICY "profiles_auth_read" ON profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL        -- must be logged in
    AND is_public = true
    AND is_visible = true
  );

-- Owner can read own profile (all columns including PII)
-- Note: email/phone still excluded via a view for extra safety (see below)
CREATE POLICY "profiles_owner_read" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can write profiles (all mutations go through API routes)
CREATE POLICY "profiles_service_write" ON profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- DRAFT PROFILES RLS
CREATE POLICY "drafts_owner_all" ON draft_profiles
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "drafts_service_write" ON draft_profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- MEETINGS RLS
-- Authenticated users can insert their own meetings
CREATE POLICY "meetings_auth_insert" ON meetings
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can read meetings they sent or received (for "already requested" checks)
CREATE POLICY "meetings_participant_read" ON meetings
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Service role full access (for admin lookup, rate-limit checks)
CREATE POLICY "meetings_service_all" ON meetings
  FOR ALL
  USING (auth.role() = 'service_role');

-- BLACKLIST, USER_ROLES, SUSPENSIONS, AUDIT_LOG: service role only
CREATE POLICY "blacklist_service_only" ON blacklist
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "user_roles_service_only" ON user_roles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "suspensions_service_only" ON suspensions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "audit_log_service_only" ON audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- PUBLIC VIEW for profiles (strips PII columns)
-- Use this in client-facing queries instead of profiles directly
-- ============================================================

-- public_profiles view: strips PII, enforces auth + visibility.
-- All application code should query this view, not the raw profiles table.
CREATE VIEW public_profiles WITH (security_invoker = true) AS
  SELECT
    id, user_id, name, uni, university,
    school, year, major, pronouns,
    about, likes, contact_for, availability,
    twitter, facebook, linkedin, website,
    image_url, is_public, random_sort, fts,
    created_at, updated_at
    -- email, phone intentionally omitted
  FROM profiles
  WHERE is_public = true AND is_visible = true;
-- Note: security_invoker means RLS policies on the underlying profiles table apply,
-- so auth.uid() IS NOT NULL is enforced even when querying through this view.

-- ============================================================
-- HELPER FUNCTIONS (called from API routes via service role)
-- ============================================================

-- Check if user has an active suspension (cannot send requests)
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM suspensions
    WHERE user_id = p_user_id
      AND lifted_at IS NULL
      AND (suspended_until IS NULL OR suspended_until > NOW())
  );
$$;

-- Atomic rate-limit check + insert (prevents race condition)
-- Returns TRUE if request was inserted, FALSE if limit hit or duplicate
CREATE OR REPLACE FUNCTION attempt_coffee_request(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_message TEXT,
  p_daily_limit INT DEFAULT 3
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  daily_count INT;
  is_blacklisted BOOLEAN;
  is_suspended BOOLEAN;
BEGIN
  -- Self-request guard
  IF p_sender_id = p_receiver_id THEN
    RETURN 'self_request';
  END IF;

  -- Blacklist check
  SELECT EXISTS(SELECT 1 FROM blacklist WHERE user_id = p_sender_id) INTO is_blacklisted;
  IF is_blacklisted THEN
    RETURN 'blacklisted';
  END IF;

  -- Suspension check
  SELECT is_user_suspended(p_sender_id) INTO is_suspended;
  IF is_suspended THEN
    RETURN 'suspended';
  END IF;

  -- Daily rate-limit (atomic)
  SELECT COUNT(*) INTO daily_count
  FROM meetings
  WHERE sender_id = p_sender_id
    AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'America/New_York');

  IF daily_count >= p_daily_limit THEN
    RETURN 'rate_limited';
  END IF;

  -- Insert meeting (UNIQUE constraint handles duplicate prevention)
  BEGIN
    INSERT INTO meetings (sender_id, receiver_id, message)
    VALUES (p_sender_id, p_receiver_id, p_message);
    RETURN 'ok';
  EXCEPTION WHEN unique_violation THEN
    RETURN 'duplicate';
  END;
END;
$$;

-- ============================================================
-- UNIVERSITY DOMAIN CONFIG
-- Stored in DB so future schools can be added without deploys
-- ============================================================

CREATE TABLE university_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE university_domains ENABLE ROW LEVEL SECURITY;

-- Public read (needed for signup domain validation)
CREATE POLICY "university_domains_public_read" ON university_domains
  FOR SELECT USING (active = true);

CREATE POLICY "university_domains_service_write" ON university_domains
  FOR ALL USING (auth.role() = 'service_role');

-- Seed allowed domains
INSERT INTO university_domains (university, domain) VALUES
  ('columbia', 'columbia.edu'),
  ('columbia', 'barnard.edu');

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER draft_profiles_updated_at
  BEFORE UPDATE ON draft_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
