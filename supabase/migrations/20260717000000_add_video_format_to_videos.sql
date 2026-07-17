BEGIN;

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS video_format TEXT;

ALTER TABLE public.videos
  DROP CONSTRAINT IF EXISTS videos_video_format_check;

ALTER TABLE public.videos
  ADD CONSTRAINT videos_video_format_check
  CHECK (
    video_format IS NULL OR video_format IN ('standard', 'shorts')
  );

UPDATE public.videos
SET video_format = 'shorts'
WHERE video_format IS NULL
  AND youtube_url ILIKE '%youtube.com/shorts/%';

COMMIT;
