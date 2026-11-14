-- Additive migration for explicit tourist login and editable Telegram profiles.
-- Safe to run repeatedly. Does not delete or rewrite existing accounts or sessions.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_name_customized boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_customized boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS user_phone_credentials (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_phone_login_attempts (
  phone_hash text PRIMARY KEY,
  failure_count integer NOT NULL DEFAULT 0,
  first_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);
COMMIT;
