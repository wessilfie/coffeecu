-- Update FTS column to index responses instead of removed free-text fields
-- Update public_profiles view to expose responses and degree
--
-- Uses a trigger instead of GENERATED ALWAYS because jsonb_to_tsvector
-- is STABLE (not IMMUTABLE) and cannot be used in generated columns.

-- ============================================================
-- 1. Replace generated fts column with a plain tsvector column
-- ============================================================

ALTER TABLE profiles DROP COLUMN IF EXISTS fts;
ALTER TABLE profiles ADD COLUMN fts TSVECTOR;

-- ============================================================
-- 2. Trigger function to maintain fts on every insert/update
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

-- Recreate GIN index on new fts column
CREATE INDEX IF NOT EXISTS profiles_fts_idx ON profiles USING GIN (fts);

-- ============================================================
-- 3. Rebuild public_profiles view
--    Adds: responses, degree
--    Removes: about, likes, contact_for, availability (app no longer uses)
-- ============================================================

DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles WITH (security_invoker = true) AS
  SELECT
    id, user_id, name, uni, university,
    school, year, degree, major, pronouns,
    responses,
    twitter, facebook, linkedin, instagram, youtube, tiktok, website,
    image_url, is_public, random_sort, fts,
    created_at, updated_at
    -- email, phone intentionally omitted
  FROM profiles
  WHERE is_public = true AND is_visible = true;
