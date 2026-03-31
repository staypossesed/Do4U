-- ============================================
-- STORAGE: Create bucket + RLS policies
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- 1. Create the bucket (skip if already created via Dashboard)
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- 2. Drop any existing policies to avoid conflicts
drop policy if exists "Public read listing images" on storage.objects;
drop policy if exists "Auth upload listing images" on storage.objects;
drop policy if exists "Auth update listing images" on storage.objects;
drop policy if exists "Auth delete listing images" on storage.objects;
drop policy if exists "Anyone can view listing images" on storage.objects;
drop policy if exists "Authenticated users can upload listing images" on storage.objects;

-- 3. SELECT — anyone can view images in listing-images bucket
create policy "Public read listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- 4. INSERT — any authenticated user can upload
create policy "Auth upload listing images"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
  );

-- 5. UPDATE — owners can update their own files (path starts with their user id)
create policy "Auth update listing images"
  on storage.objects for update
  using (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. DELETE — owners can delete their own files
create policy "Auth delete listing images"
  on storage.objects for delete
  using (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
