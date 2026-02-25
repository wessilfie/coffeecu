-- ============================================================
-- Migration 008: Community visibility scoping
-- Adds communities reference table + visible_in columns
-- profiles/draft_profiles default to ARRAY['columbia'] so
-- all existing data stays university-wide with zero backfill.
-- ============================================================

-- 1. communities reference table
CREATE TABLE IF NOT EXISTS communities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,        -- 'columbia', 'columbia-bus', etc.
  label       TEXT NOT NULL,
  university  TEXT NOT NULL DEFAULT 'columbia',
  school_code TEXT,                        -- NULL = university-wide community
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: public read (active rows only), service role write
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communities_public_read"
  ON communities FOR SELECT
  USING (active = true);

CREATE POLICY "communities_service_write"
  ON communities FOR ALL
  USING (auth.role() = 'service_role');

-- Seed: 1 university-wide + 19 school communities = 20 rows
INSERT INTO communities (slug, label, university, school_code) VALUES
  ('columbia',       'Columbia University',                                              'columbia', NULL),
  ('columbia-cc',    'Columbia College',                                                 'columbia', 'CC'),
  ('columbia-seas',  'Fu Foundation School of Engineering & Applied Science',            'columbia', 'SEAS'),
  ('columbia-gs',    'School of General Studies',                                        'columbia', 'GS'),
  ('columbia-bc',    'Barnard College',                                                  'columbia', 'BC'),
  ('columbia-gsas',  'Graduate School of Arts & Sciences',                               'columbia', 'GSAS'),
  ('columbia-bus',   'Columbia Business School',                                         'columbia', 'BUS'),
  ('columbia-law',   'Columbia Law School',                                              'columbia', 'LAW'),
  ('columbia-vps',   'Vagelos College of Physicians & Surgeons',                         'columbia', 'VPS'),
  ('columbia-jrn',   'Columbia Journalism School',                                       'columbia', 'JRN'),
  ('columbia-sipa',  'School of International & Public Affairs',                         'columbia', 'SIPA'),
  ('columbia-gsapp', 'Graduate School of Architecture, Planning & Preservation',         'columbia', 'GSAPP'),
  ('columbia-soa',   'School of the Arts',                                               'columbia', 'SOA'),
  ('columbia-sw',    'School of Social Work',                                            'columbia', 'SW'),
  ('columbia-ph',    'Mailman School of Public Health',                                  'columbia', 'PH'),
  ('columbia-nrs',   'School of Nursing',                                                'columbia', 'NRS'),
  ('columbia-dm',    'College of Dental Medicine',                                       'columbia', 'DM'),
  ('columbia-sps',   'School of Professional Studies',                                   'columbia', 'SPS'),
  ('columbia-cs',    'Columbia Climate School',                                          'columbia', 'CS'),
  ('columbia-tc',    'Teachers College',                                                 'columbia', 'TC')
ON CONFLICT (slug) DO NOTHING;

-- 2. Add visible_in to profiles and draft_profiles
--    Default ARRAY['columbia'] means all existing profiles stay
--    university-wide — no backfill needed.
ALTER TABLE profiles       ADD COLUMN IF NOT EXISTS visible_in TEXT[] NOT NULL DEFAULT ARRAY['columbia'];
ALTER TABLE draft_profiles ADD COLUMN IF NOT EXISTS visible_in TEXT[] NOT NULL DEFAULT ARRAY['columbia'];

-- GIN index for fast @> (contains) queries on the home page
CREATE INDEX IF NOT EXISTS profiles_visible_in_idx ON profiles USING GIN (visible_in);

-- 3. Rebuild public_profiles view to expose visible_in
--    Follows the DROP/CREATE pattern from 006_update_fts_and_view.sql.
--    WHERE clause unchanged — community filtering happens at query time.
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles WITH (security_invoker = true) AS
  SELECT
    id, user_id, name, uni, university,
    school, year, degree, major, pronouns,
    responses,
    twitter, facebook, linkedin, instagram, youtube, tiktok, website,
    image_url, is_public, random_sort, fts,
    visible_in,
    created_at, updated_at
    -- email, phone intentionally omitted
  FROM profiles
  WHERE is_public = true AND is_visible = true;
