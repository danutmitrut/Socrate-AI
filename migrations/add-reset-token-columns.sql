-- Migration: Add reset_token and reset_token_expiry columns
-- Date: 2025-11-15
-- Description: Add password reset functionality columns to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('reset_token', 'reset_token_expiry');
