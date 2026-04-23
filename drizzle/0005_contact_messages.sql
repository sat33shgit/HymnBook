CREATE TABLE IF NOT EXISTS contact_messages (
  id serial PRIMARY KEY,
  name varchar(40) NOT NULL,
  email varchar(60) NOT NULL,
  request_type varchar(50) NOT NULL,
  message text NOT NULL,
  consent_to_contact boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON contact_messages (created_at);

CREATE INDEX IF NOT EXISTS idx_contact_messages_request_type
  ON contact_messages (request_type);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email
  ON contact_messages (email);
