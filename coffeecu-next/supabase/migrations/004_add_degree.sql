-- ============================================================
-- Migration 004: Add degree field to profiles
-- Allows users to indicate their degree program (BA, PhD, MBA…)
-- ============================================================

ALTER TABLE profiles       ADD COLUMN degree TEXT;
ALTER TABLE draft_profiles ADD COLUMN degree TEXT;

-- Update public_profiles view to expose degree
CREATE OR REPLACE VIEW public_profiles WITH (security_invoker = true) AS
  SELECT
    id, user_id, name, uni, university,
    school, year, degree, major, pronouns,
    about, likes, contact_for, availability,
    twitter, facebook, linkedin, instagram, youtube, tiktok, website,
    image_url, is_public, random_sort, fts,
    created_at, updated_at
    -- email, phone intentionally omitted
  FROM profiles
  WHERE is_public = true AND is_visible = true;
