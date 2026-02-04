-- Confirm all demo users' emails
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email IN (
  'principal@demo.com',
  'coordinator@demo.com',
  'classteacher@demo.com',
  'teacher@demo.com',
  'student@demo.com',
  'parent@demo.com'
)
AND email_confirmed_at IS NULL;
