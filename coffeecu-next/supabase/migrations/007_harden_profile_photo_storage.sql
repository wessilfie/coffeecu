-- ============================================================
-- Migration 007: Harden storage policies for profile photos
-- ============================================================

-- Ensure the bucket exists and remains public-read for profile rendering.
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update
set public = true;

-- Remove legacy policies if they exist so policy behavior is deterministic.
drop policy if exists "profile_photos_public_read" on storage.objects;
drop policy if exists "profile_photos_owner_insert" on storage.objects;
drop policy if exists "profile_photos_owner_update" on storage.objects;
drop policy if exists "profile_photos_owner_delete" on storage.objects;

-- Public reads are allowed for this bucket only.
create policy "profile_photos_public_read"
on storage.objects
for select
using (bucket_id = 'profile-photos');

-- Authenticated users can only upload into profiles/<auth.uid()>/...
create policy "profile_photos_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can only update their own path in this bucket.
create policy "profile_photos_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can only delete their own photo objects.
create policy "profile_photos_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
);
