-- ============================================================
-- Migration 003: Expand school CHECK constraint to all CU schools
-- Previously only allowed: 'CC', 'SEAS', 'GS', 'BC', 'GR'
-- ============================================================

-- Migrate legacy 'GR' (generic graduate) to 'GSAS'
UPDATE profiles       SET school = 'GSAS' WHERE school = 'GR';
UPDATE draft_profiles SET school = 'GSAS' WHERE school = 'GR';

-- Drop old constraints
ALTER TABLE profiles       DROP CONSTRAINT IF EXISTS profiles_school_check;
ALTER TABLE draft_profiles DROP CONSTRAINT IF EXISTS draft_profiles_school_check;

-- Add expanded constraints matching the School type in types/index.ts
ALTER TABLE profiles ADD CONSTRAINT profiles_school_check
  CHECK (school IN (
    'CC','SEAS','GS','BC',
    'GSAS','BUS','LAW','VPS','JRN','SIPA','GSAPP','SOA','SW','PH','NRS','DM','SPS','CS','TC'
  ) OR school IS NULL);

ALTER TABLE draft_profiles ADD CONSTRAINT draft_profiles_school_check
  CHECK (school IN (
    'CC','SEAS','GS','BC',
    'GSAS','BUS','LAW','VPS','JRN','SIPA','GSAPP','SOA','SW','PH','NRS','DM','SPS','CS','TC'
  ) OR school IS NULL);
