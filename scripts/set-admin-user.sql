-- Script to set guillaume@gcinformatik.fr as the admin user
-- This updates the is_admin flag in the companies table for this user

-- First, we need to find the user_id from the auth.users table
-- Then update the corresponding company record

UPDATE companies
SET is_admin = true, updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'guillaume@gcinformatik.fr'
);

-- If no company exists yet for this user, we'll also ensure that
-- when the user first logs in and a company is created, it will be set as admin
-- This is handled in the application code, but let's verify the update worked:

-- Check if the update was successful (will return the updated record)
SELECT c.id, c.name, c.is_admin, u.email
FROM companies c
JOIN auth.users u ON c.user_id = u.id
WHERE u.email = 'guillaume@gcinformatik.fr';
