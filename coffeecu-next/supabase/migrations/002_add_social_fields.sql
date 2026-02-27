-- ============================================================
-- Migration 002: Add instagram, youtube, tiktok social fields
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN instagram TEXT CHECK (instagram IS NULL OR instagram ~ '^https://'),
  ADD COLUMN youtube   TEXT CHECK (youtube   IS NULL OR youtube   ~ '^https://'),
  ADD COLUMN tiktok    TEXT CHECK (tiktok    IS NULL OR tiktok    ~ '^https://');

ALTER TABLE draft_profiles
  ADD COLUMN instagram TEXT CHECK (instagram IS NULL OR instagram ~ '^https://'),
  ADD COLUMN youtube   TEXT CHECK (youtube   IS NULL OR youtube   ~ '^https://'),
  ADD COLUMN tiktok    TEXT CHECK (tiktok    IS NULL OR tiktok    ~ '^https://');

-- Update public_profiles view to expose new columns
CREATE OR REPLACE VIEW public_profiles WITH (security_invoker = true) AS
  SELECT
    id, user_id, name, uni, university,
    school, year, major, pronouns,
    about, likes, contact_for, availability,
    twitter, facebook, linkedin, instagram, youtube, tiktok, website,
    image_url, is_public, random_sort, fts,
    created_at, updated_at
    -- email, phone intentionally omitted
  FROM profiles
  WHERE is_public = true AND is_visible = true;
