-- Investigation Storage: check + fix helpers
-- Bucket: investigations
--
-- Use this to:
-- 1) Check what path is stored in DB for an investigation
-- 2) Check whether a matching storage object exists
-- 3) Fix legacy data:
--    - storage.objects.name accidentally prefixed with "investigations/"
--    - investigations.results_url stored as full public URL or prefixed path

-- =========================
-- 0) Set the investigation id
-- =========================
-- Replace with your investigation UUID:
-- \set investigation_id '18432de0-17a8-44d4-9320-3d1b77851d82'

-- =========================
-- 1) Inspect the DB row
-- =========================
select
  id,
  status,
  results_url,
  results_text,
  completed_at,
  updated_at
from public.investigations
where id = :'investigation_id';

-- =========================
-- 2) Inspect storage objects for this investigation folder
-- =========================
select
  bucket_id,
  name,
  created_at,
  metadata
from storage.objects
where bucket_id = 'investigations'
  and name like (:'investigation_id' || '/%')
order by created_at desc
limit 50;

-- =========================
-- 3) Legacy fix: rename objects that start with "investigations/"
-- =========================
-- If you see names like:
--   investigations/<investigationId>/<timestamp>.pdf
-- this will rewrite them to:
--   <investigationId>/<timestamp>.pdf
update storage.objects
set name = regexp_replace(name, '^investigations/', '')
where bucket_id = 'investigations'
  and name like 'investigations/%';

-- =========================
-- 4) Legacy fix: normalize results_url to store object path only
-- =========================
-- Converts either:
--   https://<project>.supabase.co/storage/v1/object/public/investigations/<objectName>
--   https://<project>.supabase.co/storage/v1/object/sign/investigations/<objectName>
--   investigations/<objectName>
-- into:
--   <objectName>
update public.investigations
set results_url = regexp_replace(
  regexp_replace(
    results_url,
    '^https?://[^/]+/storage/v1/object/(public|sign)/investigations/',
    ''
  ),
  '^investigations/',
  ''
)
where results_url is not null
  and (
    results_url like 'https://%'
    or results_url like 'investigations/%'
  );

-- =========================
-- 5) Verify after fixes
-- =========================
select
  id,
  status,
  results_url
from public.investigations
where id = :'investigation_id';

select
  bucket_id,
  name,
  created_at
from storage.objects
where bucket_id = 'investigations'
  and name like (:'investigation_id' || '/%')
order by created_at desc
limit 50;

