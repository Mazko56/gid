-- Safe additive changes for deployments with DB_AUTO_MIGRATE=false. No existing records are deleted.
ALTER TABLE customer_qr_tokens ADD COLUMN IF NOT EXISTS context_region_id text REFERENCES regions(id);
ALTER TABLE customer_qr_tokens ADD COLUMN IF NOT EXISTS context_place_id text REFERENCES places(id);
CREATE INDEX IF NOT EXISTS idx_activity_place_type ON activity_events(place_id,event_type,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_qr_scans_unique
  ON activity_events(place_id,(payload->>'token_hash')) WHERE event_type='partner_customer_qr_scanned';
