-- Add subscribers table for email subscriptions
CREATE TABLE IF NOT EXISTS subscribers (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  token varchar(128) NOT NULL UNIQUE,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers (created_at);
