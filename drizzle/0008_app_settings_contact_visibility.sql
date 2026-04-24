INSERT INTO app_settings (key, bool_value)
VALUES ('public_contact_visible', true)
ON CONFLICT (key) DO NOTHING;
