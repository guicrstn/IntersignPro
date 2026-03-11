-- Fix the status check constraint to include 'pending'
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_status_check;
ALTER TABLE licenses ADD CONSTRAINT licenses_status_check 
  CHECK (status IN ('pending', 'active', 'suspended', 'expired'));
