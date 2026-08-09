-- Storage: "Actual PDF files" and "Profile pictures" from the data plan.
-- Both buckets are public-read (so a saved file_url/avatar_url works directly
-- in <img>/<a> tags), but writes are locked to the owner's own folder,
-- enforced by requiring the first path segment to equal the user's uid, e.g.
-- materials/<uploader_id>/<filename>.pdf and avatars/<user_id>/<filename>.jpg.
insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Materials are publicly readable"
  on storage.objects for select
  using (bucket_id = 'materials');

create policy "Users upload materials into their own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update their own material files"
  on storage.objects for update
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their own material files"
  on storage.objects for delete
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
