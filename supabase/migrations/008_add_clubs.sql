-- ============================================================
-- 008_add_clubs.sql
-- Adds CBS student clubs array to profiles and draft_profiles,
-- updates the FTS trigger to index club names,
-- and rebuilds the public_profiles view to expose clubs.
-- Run this in the Supabase SQL editor.
-- ============================================================

ALTER TABLE profiles       ADD COLUMN IF NOT EXISTS clubs TEXT[] DEFAULT '{}';
ALTER TABLE draft_profiles ADD COLUMN IF NOT EXISTS clubs TEXT[] DEFAULT '{}';

-- Update FTS trigger to index club names
CREATE OR REPLACE FUNCTION update_profiles_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts :=
    to_tsvector('english',
      coalesce(NEW.name, '') || ' ' ||
      coalesce(NEW.uni, '') || ' ' ||
      coalesce(array_to_string(NEW.major, ' '), '') || ' ' ||
      coalesce(array_to_string(NEW.clubs, ' '), '') || ' ' ||
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

-- Rebuild view to expose clubs
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles WITH (security_invoker = true) AS
  SELECT
    id, user_id, name, uni, university,
    school, year, degree, major, pronouns,
    responses, clubs,
    twitter, facebook, linkedin, instagram, youtube, tiktok, website,
    image_url, is_public, random_sort, fts,
    created_at, updated_at
  FROM profiles
  WHERE is_public = true AND is_visible = true;
