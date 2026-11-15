-- Non-destructive, optional phone for useful services on the emergency screen.
ALTER TABLE emergency_services ADD COLUMN IF NOT EXISTS phone text;
