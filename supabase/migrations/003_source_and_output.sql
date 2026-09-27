alter table translation_jobs add column if not exists source_path text;
alter table translation_jobs add column if not exists output_path text;

create index if not exists translation_jobs_created_at_idx on translation_jobs(created_at desc);
