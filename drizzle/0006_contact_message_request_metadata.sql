ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS city varchar(120),
ADD COLUMN IF NOT EXISTS country varchar(120),
ADD COLUMN IF NOT EXISTS device_type varchar(20);

CREATE INDEX IF NOT EXISTS idx_contact_messages_country
  ON contact_messages (country);

CREATE INDEX IF NOT EXISTS idx_contact_messages_device_type
  ON contact_messages (device_type);
