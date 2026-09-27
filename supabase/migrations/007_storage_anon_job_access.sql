create policy "manga jobs anon insert"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'manga-files'
  and name like 'jobs/%'
);

create policy "manga jobs anon select"
on storage.objects
for select
to anon
using (
  bucket_id = 'manga-files'
  and name like 'jobs/%'
);

create policy "manga jobs anon update"
on storage.objects
for update
to anon
using (
  bucket_id = 'manga-files'
  and name like 'jobs/%'
)
with check (
  bucket_id = 'manga-files'
  and name like 'jobs/%'
);

create policy "manga jobs anon delete"
on storage.objects
for delete
to anon
using (
  bucket_id = 'manga-files'
  and name like 'jobs/%'
);
