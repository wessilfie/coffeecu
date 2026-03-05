# Supabase Migration — 008: Add CBS Student Clubs

Copy and paste the SQL below into the **Supabase SQL Editor** and click **Run**.

---

```sql
-- ============================================================
-- 008_add_clubs.sql
-- Adds CBS student clubs array to profiles and draft_profiles,
-- updates the FTS trigger to index club names,
-- and rebuilds the public_profiles view to expose clubs.
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
```

---

## What this does

| Change | Effect |
|--------|--------|
| `ALTER TABLE profiles ADD COLUMN clubs TEXT[]` | Stores selected CBS clubs for published profiles (default empty array) |
| `ALTER TABLE draft_profiles ADD COLUMN clubs TEXT[]` | Same for in-progress drafts |
| Updated `update_profiles_fts()` trigger | Club names are now indexed by full-text search so typing a club name in the search bar finds those members |
| Rebuilt `public_profiles` view | Exposes the `clubs` column to the client-side queries |

## After running

Once the migration is applied, merge the `feature/cbs-student-clubs` branch into master and deploy. No other manual steps needed.
