-- Add is_admin column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set your account as admin (you'll need to update this with your user_id)
-- You can run this manually after finding your user_id:
-- UPDATE companies SET is_admin = TRUE WHERE user_id = 'your-user-id-here';
