-- Add location column to subscribers table
ALTER TABLE IF EXISTS subscribers
  ADD COLUMN IF NOT EXISTS location varchar(120);

CREATE INDEX IF NOT EXISTS idx_subscribers_location ON subscribers (location);
