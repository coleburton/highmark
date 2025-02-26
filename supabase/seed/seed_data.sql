-- Seed data for the Highmark cannabis app

-- Sample strains
INSERT INTO strains (name, type, thc_percentage, cbd_percentage, effects, flavors, description, image_url, approved)
VALUES
  ('Blue Dream', 'Hybrid', 18.0, 0.1, ARRAY['Relaxed', 'Happy', 'Euphoric', 'Creative'], ARRAY['Berry', 'Sweet', 'Blueberry'], 'Blue Dream is a sativa-dominant hybrid that balances full-body relaxation with gentle cerebral invigoration.', 'https://example.com/images/blue-dream.jpg', TRUE),
  
  ('OG Kush', 'Hybrid', 23.0, 0.3, ARRAY['Relaxed', 'Happy', 'Euphoric', 'Uplifted'], ARRAY['Earthy', 'Pine', 'Woody'], 'OG Kush is a legendary strain with a unique terpene profile that delivers a blend of fuel, skunk, and spice.', 'https://example.com/images/og-kush.jpg', TRUE),
  
  ('Granddaddy Purple', 'Indica', 17.5, 0.1, ARRAY['Relaxed', 'Sleepy', 'Happy'], ARRAY['Grape', 'Berry', 'Sweet'], 'Granddaddy Purple is a famous indica cross known for its deep purple buds and powerful effects.', 'https://example.com/images/granddaddy-purple.jpg', TRUE),
  
  ('Sour Diesel', 'Sativa', 20.0, 0.2, ARRAY['Energetic', 'Happy', 'Uplifted', 'Euphoric'], ARRAY['Diesel', 'Pungent', 'Earthy'], 'Sour Diesel is a fast-acting strain delivering energizing, dreamy cerebral effects.', 'https://example.com/images/sour-diesel.jpg', TRUE),
  
  ('Girl Scout Cookies', 'Hybrid', 19.0, 0.2, ARRAY['Happy', 'Euphoric', 'Relaxed'], ARRAY['Sweet', 'Earthy', 'Dessert'], 'Girl Scout Cookies is a hybrid strain with a sweet and earthy aroma and powerful full-body effects.', 'https://example.com/images/girl-scout-cookies.jpg', TRUE),
  
  ('Northern Lights', 'Indica', 16.0, 0.1, ARRAY['Relaxed', 'Sleepy', 'Happy', 'Euphoric'], ARRAY['Sweet', 'Spicy', 'Pine'], 'Northern Lights is a pure indica known for its resinous buds and resilience during growth.', 'https://example.com/images/northern-lights.jpg', TRUE),
  
  ('Jack Herer', 'Sativa', 18.0, 0.2, ARRAY['Happy', 'Uplifted', 'Creative', 'Focused'], ARRAY['Earthy', 'Pine', 'Woody'], 'Jack Herer is a sativa-dominant strain that has gained as much renown as its namesake.', 'https://example.com/images/jack-herer.jpg', TRUE),
  
  ('Wedding Cake', 'Hybrid', 25.0, 0.1, ARRAY['Relaxed', 'Happy', 'Euphoric'], ARRAY['Sweet', 'Vanilla', 'Earthy'], 'Wedding Cake is a potent indica-hybrid strain known for its rich and tangy flavor profile.', 'https://example.com/images/wedding-cake.jpg', TRUE),
  
  ('Durban Poison', 'Sativa', 17.5, 0.1, ARRAY['Energetic', 'Focused', 'Creative', 'Uplifted'], ARRAY['Sweet', 'Pine', 'Earthy'], 'Durban Poison is a pure sativa strain native to South Africa, known for its sweet smell and energetic effects.', 'https://example.com/images/durban-poison.jpg', TRUE),
  
  ('Purple Haze', 'Sativa', 16.0, 0.1, ARRAY['Creative', 'Euphoric', 'Happy', 'Uplifted'], ARRAY['Earthy', 'Sweet', 'Berry'], 'Purple Haze is a sativa-dominant strain named after Jimi Hendrix's classic song.', 'https://example.com/images/purple-haze.jpg', TRUE);

-- Note: The following seed data would typically be added after users have been created
-- in a production environment. For local development, you may need to manually create
-- users through the Supabase authentication system first, then use their IDs in these seeds.

-- Example comment for future reference:
-- Sample reviews (requires user IDs from auth system)
-- INSERT INTO reviews (user_id, strain_id, rating, review_text, effects, flavors)
-- VALUES
--   ('user-uuid-1', (SELECT id FROM strains WHERE name = 'Blue Dream'), 4.5, 'Great strain for relaxation without sedation.', ARRAY['Relaxed', 'Creative'], ARRAY['Berry', 'Sweet']),
--   ('user-uuid-2', (SELECT id FROM strains WHERE name = 'OG Kush'), 5.0, 'Classic strain that never disappoints.', ARRAY['Relaxed', 'Happy'], ARRAY['Earthy', 'Pine']);

-- Sample lists (requires user IDs from auth system)
-- INSERT INTO lists (user_id, title, description, is_public)
-- VALUES
--   ('user-uuid-1', 'My Favorite Strains', 'A collection of my all-time favorites', TRUE),
--   ('user-uuid-2', 'Best for Sleep', 'Strains that help me get a good night''s rest', TRUE);

-- Sample list strains (requires list IDs from above)
-- INSERT INTO list_strains (list_id, strain_id)
-- VALUES
--   ((SELECT id FROM lists WHERE title = 'My Favorite Strains' AND user_id = 'user-uuid-1'), (SELECT id FROM strains WHERE name = 'Blue Dream')),
--   ((SELECT id FROM lists WHERE title = 'My Favorite Strains' AND user_id = 'user-uuid-1'), (SELECT id FROM strains WHERE name = 'Sour Diesel')),
--   ((SELECT id FROM lists WHERE title = 'Best for Sleep' AND user_id = 'user-uuid-2'), (SELECT id FROM strains WHERE name = 'Northern Lights')),
--   ((SELECT id FROM lists WHERE title = 'Best for Sleep' AND user_id = 'user-uuid-2'), (SELECT id FROM strains WHERE name = 'Granddaddy Purple')); 