-- Additive and non-destructive. Run on Railway PostgreSQL if DB_AUTO_MIGRATE=false.
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;
ALTER TABLE emergency_services ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;
ALTER TABLE qr_points ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
