ALTER TABLE song_translations
ADD COLUMN IF NOT EXISTS audio_url text;

UPDATE song_translations st
SET audio_url = s.audio_url
FROM songs s
WHERE st.song_id = s.id
  AND st.language_code = COALESCE(s.default_lang, 'en')
  AND st.audio_url IS NULL
  AND s.audio_url IS NOT NULL;

ALTER TABLE songs
DROP COLUMN IF EXISTS audio_url;