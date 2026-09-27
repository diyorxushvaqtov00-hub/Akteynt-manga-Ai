create table if not exists text_blocks (
  id uuid primary key,
  page_id uuid not null references manga_pages(id) on delete cascade,
  block_key text not null,
  source_text text not null,
  translated_text text,
  x numeric not null,
  y numeric not null,
  width numeric not null,
  height numeric not null,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status text not null default 'detected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(page_id, block_key)
);

create index if not exists text_blocks_page_id_idx on text_blocks(page_id);
create index if not exists text_blocks_status_idx on text_blocks(status);
