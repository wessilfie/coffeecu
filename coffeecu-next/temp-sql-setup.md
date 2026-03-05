# Coffee@CU — Supabase SQL Setup

---

## Part 1 — Main schema
Paste into: **SQL Editor → New query → Run**

---

```sql
-- ============================================================
-- Coffee@CU — Full Schema (all migrations, clean state)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE user_role AS ENUM ('moderator', 'admin', 'super_admin');
CREATE TYPE suspension_type AS ENUM ('temporary', 'indefinite');

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 40),
  uni TEXT,
  university TEXT NOT NULL DEFAULT 'columbia',
  email TEXT,
  phone TEXT,
  school TEXT CHECK (school IN (
    'CC','SEAS','GS','BC',
    'GSAS','BUS','LAW','VPS','JRN','SIPA','GSAPP','SOA','SW','PH','NRS','DM','SPS','CS','TC'
  ) OR school IS NULL),
  year TEXT,
  degree TEXT,
  major TEXT[] DEFAULT '{}',
  pronouns TEXT CHECK (char_length(pronouns) <= 50 OR pronouns IS NULL),
  about TEXT CHECK (char_length(about) <= 400 OR about IS NULL),
  likes TEXT CHECK (char_length(likes) <= 150 OR likes IS NULL),
  contact_for TEXT CHECK (char_length(contact_for) <= 250 OR contact_for IS NULL),
  availability TEXT CHECK (char_length(availability) <= 150 OR availability IS NULL),
  responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  twitter TEXT CHECK (twitter IS NULL OR twitter ~ '^https://'),
  facebook TEXT CHECK (facebook IS NULL OR facebook ~ '^https://'),
  linkedin TEXT CHECK (linkedin IS NULL OR linkedin ~ '^https://'),
  instagram TEXT CHECK (instagram IS NULL OR instagram ~ '^https://'),
  youtube TEXT CHECK (youtube IS NULL OR youtube ~ '^https://'),
  tiktok TEXT CHECK (tiktok IS NULL OR tiktok ~ '^https://'),
  website TEXT CHECK (website IS NULL OR website ~ '^https://'),
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  random_sort FLOAT NOT NULL DEFAULT random(),
  fts TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_fts_idx ON profiles USING GIN(fts);
CREATE INDEX profiles_school_year_idx ON profiles (school, year);
CREATE INDEX profiles_random_sort_idx ON profiles (random_sort);
CREATE INDEX profiles_visibility_idx ON profiles (is_public, is_visible);
CREATE INDEX profiles_name_trgm_idx ON profiles USING GIN(name gin_trgm_ops);

-- ============================================================
-- DRAFT PROFILES
-- ============================================================
CREATE TABLE draft_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT CHECK (char_length(name) <= 40 OR name IS NULL),
  uni TEXT,
  university TEXT NOT NULL DEFAULT 'columbia',
  email TEXT,
  phone TEXT,
  school TEXT CHECK (school IN (
    'CC','SEAS','GS','BC',
    'GSAS','BUS','LAW','VPS','JRN','SIPA','GSAPP','SOA','SW','PH','NRS','DM','SPS','CS','TC'
  ) OR school IS NULL),
  year TEXT,
  degree TEXT,
  major TEXT[] DEFAULT '{}',
  pronouns TEXT,
  about TEXT,
  likes TEXT,
  contact_for TEXT,
  availability TEXT,
  responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  twitter TEXT CHECK (twitter IS NULL OR twitter ~ '^https://'),
  facebook TEXT CHECK (facebook IS NULL OR facebook ~ '^https://'),
  linkedin TEXT CHECK (linkedin IS NULL OR linkedin ~ '^https://'),
  instagram TEXT CHECK (instagram IS NULL OR instagram ~ '^https://'),
  youtube TEXT CHECK (youtube IS NULL OR youtube ~ '^https://'),
  tiktok TEXT CHECK (tiktok IS NULL OR tiktok ~ '^https://'),
  website TEXT CHECK (website IS NULL OR website ~ '^https://'),
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEETINGS
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

CREATE INDEX meetings_sender_date_idx ON meetings (sender_id, created_at DESC);
CREATE INDEX meetings_receiver_idx ON meetings (receiver_id);

-- ============================================================
-- BLACKLIST / USER ROLES / SUSPENSIONS / AUDIT LOG
-- ============================================================
CREATE TABLE blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  reason TEXT,
  banned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role user_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suspension_type suspension_type NOT NULL DEFAULT 'indefinite',
  reason TEXT,
  suspended_until TIMESTAMPTZ,
  suspended_by UUID REFERENCES auth.users(id) NOT NULL,
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX suspensions_user_active_idx ON suspensions (user_id, lifted_at, suspended_until);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_table TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_actor_idx ON audit_log (actor_id, created_at DESC);
CREATE INDEX audit_log_target_idx ON audit_log (target_user_id, created_at DESC);

-- ============================================================
-- UNIVERSITY DOMAINS
-- ============================================================
CREATE TABLE university_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO university_domains (university, domain) VALUES
  ('columbia', 'columbia.edu'),
  ('columbia', 'barnard.edu');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_auth_read" ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_public = true AND is_visible = true);
CREATE POLICY "profiles_owner_read" ON profiles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "profiles_service_write" ON profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "drafts_owner_all" ON draft_profiles FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "drafts_service_write" ON draft_profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "meetings_auth_insert" ON meetings FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "meetings_participant_read" ON meetings FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "meetings_service_all" ON meetings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "blacklist_service_only" ON blacklist FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "user_roles_service_only" ON user_roles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "suspensions_service_only" ON suspensions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "audit_log_service_only" ON audit_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "university_domains_public_read" ON university_domains FOR SELECT USING (active = true);
CREATE POLICY "university_domains_service_write" ON university_domains FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- PUBLIC VIEW (no PII)
-- ============================================================
CREATE VIEW public_profiles WITH (security_invoker = true) AS
  SELECT
    id, user_id, name, uni, university,
    school, year, degree, major, pronouns,
    responses,
    twitter, facebook, linkedin, instagram, youtube, tiktok, website,
    image_url, is_public, random_sort, fts,
    created_at, updated_at
  FROM profiles
  WHERE is_public = true AND is_visible = true;

-- ============================================================
-- FTS TRIGGER (maintains fts column on every insert/update)
-- Using a trigger avoids the GENERATED ALWAYS immutability
-- constraint — jsonb_to_tsvector is STABLE, not IMMUTABLE.
-- ============================================================
CREATE OR REPLACE FUNCTION update_profiles_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts :=
    to_tsvector('english',
      coalesce(NEW.name, '') || ' ' ||
      coalesce(NEW.uni, '') || ' ' ||
      coalesce(array_to_string(NEW.major, ' '), '') || ' ' ||
      coalesce(NEW.school, '') || ' ' ||
      coalesce(NEW.year, '') || ' ' ||
      coalesce(NEW.degree, '')
    ) || jsonb_to_tsvector('english',
      coalesce(NEW.responses, '[]'::jsonb),
      '["string"]'::jsonb
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_fts_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_fts();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM suspensions
    WHERE user_id = p_user_id
      AND lifted_at IS NULL
      AND (suspended_until IS NULL OR suspended_until > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION attempt_coffee_request(
  p_sender_id UUID, p_receiver_id UUID, p_message TEXT, p_daily_limit INT DEFAULT 3
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  daily_count INT; is_blacklisted BOOLEAN; is_suspended BOOLEAN;
BEGIN
  IF p_sender_id = p_receiver_id THEN RETURN 'self_request'; END IF;
  SELECT EXISTS(SELECT 1 FROM blacklist WHERE user_id = p_sender_id) INTO is_blacklisted;
  IF is_blacklisted THEN RETURN 'blacklisted'; END IF;
  SELECT is_user_suspended(p_sender_id) INTO is_suspended;
  IF is_suspended THEN RETURN 'suspended'; END IF;
  SELECT COUNT(*) INTO daily_count FROM meetings
    WHERE sender_id = p_sender_id
      AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'America/New_York');
  IF daily_count >= p_daily_limit THEN RETURN 'rate_limited'; END IF;
  BEGIN
    INSERT INTO meetings (sender_id, receiver_id, message)
    VALUES (p_sender_id, p_receiver_id, p_message);
    RETURN 'ok';
  EXCEPTION WHEN unique_violation THEN RETURN 'duplicate';
  END;
END;
$$;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER draft_profiles_updated_at
  BEFORE UPDATE ON draft_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Part 2 — Storage bucket policies

First, create the bucket manually:
**Storage → New bucket → Name: `profile-photos` → Public bucket: ON → Save**

Then run this in **SQL Editor → New query**:

```sql
-- Allow authenticated users to upload/replace their own avatar
-- Path structure used by the app: profiles/{userId}/avatar.{ext}

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND name LIKE 'profiles/' || auth.uid()::text || '/%'
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND name LIKE 'profiles/' || auth.uid()::text || '/%'
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND name LIKE 'profiles/' || auth.uid()::text || '/%'
);
```

Public read is automatic on a public bucket — no extra policy needed.
