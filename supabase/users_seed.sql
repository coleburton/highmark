-- Users seed file

-- First, insert users into auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'jane@example.com', '{"username": "JaneGreen"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'mike@example.com', '{"username": "MikeBlaze"}'::jsonb),
  ('00000000-0000-0000-0000-000000000003', 'sarah@example.com', '{"username": "CannabisQueen"}'::jsonb),
  ('00000000-0000-0000-0000-000000000004', 'alex@example.com', '{"username": "HerbExplorer"}'::jsonb),
  ('00000000-0000-0000-0000-000000000005', 'taylor@example.com', '{"username": "GreenThumb"}'::jsonb);
