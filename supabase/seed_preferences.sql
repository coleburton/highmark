-- Sample product preferences
INSERT INTO product_preferences (user_id, preferred_types, preferred_effects, preferred_flavors)
VALUES
  ('00000000-0000-0000-0000-000000000001', ARRAY['Hybrid', 'Sativa'], ARRAY['Creative', 'Happy', 'Relaxed'], ARRAY['Berry', 'Citrus', 'Sweet']),
  ('00000000-0000-0000-0000-000000000002', ARRAY['Indica', 'Hybrid'], ARRAY['Relaxed', 'Sleepy', 'Pain Relief'], ARRAY['Earthy', 'Pine', 'Woody']),
  ('00000000-0000-0000-0000-000000000003', ARRAY['Indica'], ARRAY['Relaxed', 'Sleepy', 'Happy'], ARRAY['Sweet', 'Berry', 'Grape']),
  ('00000000-0000-0000-0000-000000000004', ARRAY['Sativa'], ARRAY['Energetic', 'Creative', 'Focused'], ARRAY['Citrus', 'Pine', 'Tropical']),
  ('00000000-0000-0000-0000-000000000005', ARRAY['Hybrid'], ARRAY['Happy', 'Uplifted', 'Euphoric'], ARRAY['Sweet', 'Tropical', 'Mint']); 