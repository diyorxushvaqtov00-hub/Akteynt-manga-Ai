create table if not exists translation_jobs (
  id uuid primary key,
  filename text not null,
  status text not null default 'uploaded',
  progress integer not null default 0 check (progress between 0 and 100),
  current_page integer not null default 0,
  total_pages integer,
  source_language text default 'auto',
  target_language text not null default 'uz',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists manga_pages (
  id uuid primary key,
  job_id uuid not null references translation_jobs(id) on delete cascade,
  page_number integer not null,
  status text not null default 'pending',
  original_image_path text,
  translated_image_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, page_number)
);

create index if not exists manga_pages_job_id_idx on manga_pages(job_id);
create index if not exists translation_jobs_status_idx on translation_jobs(status);