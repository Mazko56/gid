-- Gid Tourist | QR checkout leases, durable client confirmation and Telegram delivery.
-- Additive migration; preserves financial transactions and bonus ledger.
BEGIN;
ALTER TABLE customer_qr_tokens ADD COLUMN IF NOT EXISTS scan_claimed_at timestamptz;
ALTER TABLE customer_qr_tokens ADD COLUMN IF NOT EXISTS scan_expires_at timestamptz;
ALTER TABLE customer_qr_tokens ADD COLUMN IF NOT EXISTS scan_claimed_by_user_id text REFERENCES users(id);
ALTER TABLE customer_qr_tokens ADD COLUMN IF NOT EXISTS scan_claimed_place_id text REFERENCES places(id);
ALTER TABLE purchase_transactions ALTER COLUMN expires_at DROP NOT NULL;
-- Previous 120-second pending quotes must remain accessible on customer return.
UPDATE purchase_transactions SET expires_at=NULL WHERE status='pending_customer' AND expires_at IS NOT NULL;
CREATE TABLE IF NOT EXISTS purchase_telegram_outbox (
  transaction_id text PRIMARY KEY REFERENCES purchase_transactions(id),
  user_id text NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_purchase_telegram_outbox_pending ON purchase_telegram_outbox(next_attempt_at)
  WHERE status IN ('pending','sending');
COMMIT;
