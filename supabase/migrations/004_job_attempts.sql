alter table manga_pages add column if not exists attempts integer not null default 0;
alter table manga_pages add column if not exists last_attempt_at timestamptz;
alter table manga_pages add column if not exists locked_at timestamptz;

create index if not exists manga_pages_retry_idx
on manga_pages(job_id, status, attempts, page_number);
