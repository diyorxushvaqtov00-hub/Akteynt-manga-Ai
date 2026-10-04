alter table public.manga_pages
  add column if not exists stage text not null default 'UPLOADED';

alter table public.manga_pages
  drop constraint if exists manga_pages_stage_check;

alter table public.manga_pages
  add constraint manga_pages_stage_check
  check (stage in (
    'UPLOADED','EXTRACTED','NORMALIZED','DETECTED','OCR_DONE','ANALYZED',
    'TRANSLATED','TRANSLATION_QA','CLEAN_PLAN_READY','CLEANED','CLEAN_QA',
    'TYPESET','VISUAL_QA','READY'
  ));

alter table public.translation_jobs
  add column if not exists stage text not null default 'UPLOADED';

alter table public.translation_jobs
  drop constraint if exists translation_jobs_stage_check;

alter table public.translation_jobs
  add constraint translation_jobs_stage_check
  check (stage in (
    'UPLOADED','EXTRACTED','NORMALIZED','DETECTED','OCR_DONE','ANALYZED',
    'TRANSLATED','TRANSLATION_QA','CLEAN_PLAN_READY','CLEANED','CLEAN_QA',
    'TYPESET','VISUAL_QA','READY'
  ));
