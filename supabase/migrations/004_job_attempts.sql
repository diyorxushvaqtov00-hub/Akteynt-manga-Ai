alter table manga_pages add column if not exists attempts integer not null default 0;
alter table manga_pages add column if not exists last_attempt_at timestamptz;
alter table manga_pages add column if not exists locked_at timestamptz;

create index if not exists manga_pages_retry_idx
on manga_pages(job_id, status, attempts, page_number);

-- Recover pages abandoned by a crashed worker.
create or replace function recover_stale_manga_pages(p_job_id uuid, p_timeout_seconds integer default 900)
returns integer
language plpgsql
as $$
declare
  recovered integer;
begin
  update manga_pages
  set status = 'failed',
      error = 'Worker timeout; page queued for retry.',
      locked_at = null
  where job_id = p_job_id
    and status = 'processing'
    and locked_at is not null
    and locked_at < now() - make_interval(secs => p_timeout_seconds)
    and attempts < 3;

  get diagnostics recovered = row_count;
  return recovered;
end;
$$;
