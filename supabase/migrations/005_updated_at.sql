create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists translation_jobs_set_updated_at on translation_jobs;
create trigger translation_jobs_set_updated_at
before update on translation_jobs
for each row execute function set_updated_at();

drop trigger if exists manga_pages_set_updated_at on manga_pages;
create trigger manga_pages_set_updated_at
before update on manga_pages
for each row execute function set_updated_at();

drop trigger if exists text_blocks_set_updated_at on text_blocks;
create trigger text_blocks_set_updated_at
before update on text_blocks
for each row execute function set_updated_at();
