alter table text_blocks
  add column if not exists region_type text not null default 'unknown',
  add column if not exists style jsonb not null default '{}'::jsonb,
  add column if not exists translation_context text;

create index if not exists text_blocks_region_type_idx on text_blocks(region_type);