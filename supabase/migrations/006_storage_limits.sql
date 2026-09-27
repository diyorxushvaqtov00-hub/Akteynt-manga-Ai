update storage.buckets
set
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = array['application/pdf'::text, 'image/png'::text]
where id = 'manga-files';
