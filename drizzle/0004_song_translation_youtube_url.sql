ALTER TABLE song_translations
ADD COLUMN IF NOT EXISTS youtube_url text;

-- App setting to control whether youtube links are visible on public site
CREATE TABLE IF NOT EXISTS app_settings (
  key varchar(100) PRIMARY KEY,
  bool_value boolean NOT NULL DEFAULT true,
  updated_at timestamp DEFAULT now()
);

INSERT INTO app_settings (key, bool_value)
VALUES ('public_song_youtube_visible', true)
ON CONFLICT (key) DO NOTHING;
