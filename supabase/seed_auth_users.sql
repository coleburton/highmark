-- Sample auth users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'jane@example.com', '{"username": "jane_doe"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'john@example.com', '{"username": "john_smith"}'::jsonb),
  ('00000000-0000-0000-0000-000000000003', 'alex@example.com', '{"username": "alex_green"}'::jsonb),
  ('00000000-0000-0000-0000-000000000004', 'sam@example.com', '{"username": "sam_wilson"}'::jsonb),
  ('00000000-0000-0000-0000-000000000005', 'taylor@example.com', '{"username": "taylor_lee"}'::jsonb); 