-- Allow reading basic user info for marketplace listings
drop policy if exists "Users can read own profile" on public.users;

create policy "Users can read any profile"
  on public.users for select
  using (true);

-- Allow inserting notifications for any authenticated user
create policy "Users can insert notifications"
  on public.notifications for insert
  with check (auth.uid() is not null);

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Allow Realtime on chats and notifications
alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.notifications;

-- Storage bucket for listing images (uncomment and run manually if needed)
-- insert into storage.buckets (id, name, public)
-- values ('listing-images', 'listing-images', true)
-- on conflict do nothing;
--
-- create policy "Public read listing images"
--   on storage.objects for select
--   using (bucket_id = 'listing-images');
--
-- create policy "Auth upload listing images"
--   on storage.objects for insert
--   with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');
--
-- create policy "Auth update listing images"
--   on storage.objects for update
--   using (bucket_id = 'listing-images' and auth.role() = 'authenticated');
