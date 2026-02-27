-- Add structured Q&A responses to profiles and drafts
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS responses JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE draft_profiles
  ADD COLUMN IF NOT EXISTS responses JSONB NOT NULL DEFAULT '[]'::jsonb;
