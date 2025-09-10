-- Insert test user credentials (these will be created in auth.users when they sign up)
-- For now, let's add a test official to verified_officials to match our test credentials

INSERT INTO verified_officials (
  full_name,
  email, 
  phone,
  role,
  district,
  ward, 
  state,
  is_active
) VALUES (
  'Test Official',
  'official@test.com',
  '+91-9999999999',
  'Ward Officer',
  'Test District',
  'Test Ward',
  'Test State',
  true
) ON CONFLICT (email) DO NOTHING;