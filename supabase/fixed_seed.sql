-- Clear existing data (if needed)
-- TRUNCATE strains, profiles, reviews, favorites CASCADE;

-- Sample profiles (users)
-- Note: In a real setup, users would be created through auth.users first
-- For local development, we're inserting directly into profiles
INSERT INTO profiles (id, username, email, avatar_url, bio)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'JaneGreen', 'jane@example.com', 'https://ui-avatars.com/api/?name=Jane+Green&background=10B981&color=fff', 'Cannabis enthusiast and reviewer. Love exploring new strains! 🌿'),
  ('00000000-0000-0000-0000-000000000002', 'MikeBlaze', 'mike@example.com', 'https://ui-avatars.com/api/?name=Mike+Blaze&background=7C3AED&color=fff', 'Medicinal cannabis advocate. Sharing honest reviews.'),
  ('00000000-0000-0000-0000-000000000003', 'CannabisQueen', 'sarah@example.com', 'https://ui-avatars.com/api/?name=Cannabis+Queen&background=F59E0B&color=fff', 'Cannabis educator and advocate. I believe in the healing power of this amazing plant.'),
  ('00000000-0000-0000-0000-000000000004', 'HerbExplorer', 'alex@example.com', 'https://ui-avatars.com/api/?name=Herb+Explorer&background=EF4444&color=fff', 'Recreational user with a passion for discovering unique terpene profiles.'),
  ('00000000-0000-0000-0000-000000000005', 'GreenThumb', 'taylor@example.com', 'https://ui-avatars.com/api/?name=Green+Thumb&background=3B82F6&color=fff', 'Home grower and cannabis connoisseur. Ask me about my latest harvest!');

-- Sample strains with reliable image URLs
INSERT INTO strains (id, name, type, thc_percentage, cbd_percentage, effects, flavors, description, image_url, approved, submitted_by)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Blue Dream', 'Hybrid', 18.0, 0.5, ARRAY['Relaxed', 'Happy', 'Euphoric', 'Creative'], ARRAY['Berry', 'Sweet', 'Earthy'], 'A legendary hybrid strain known for its balanced effects. Blue Dream delivers a gentle cerebral invigoration alongside full-body relaxation, making it perfect for daytime use.', 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?q=80&w=500&auto=format&fit=crop', TRUE, '00000000-0000-0000-0000-000000000001'),
  
  ('00000000-0000-0000-0000-000000000102', 'OG Kush', 'Indica', 23.0, 0.3, ARRAY['Relaxed', 'Sleepy', 'Happy'], ARRAY['Pine', 'Woody', 'Earthy'], 'A classic indica strain with powerful effects. OG Kush is known for its strong pine and woody aroma, delivering deep relaxation and stress relief.', 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?q=80&w=500&auto=format&fit=crop', TRUE, '00000000-0000-0000-0000-000000000002'),
  
  ('00000000-0000-0000-0000-000000000103', 'Sour Diesel', 'Sativa', 20.0, 0.2, ARRAY['Energetic', 'Focused', 'Creative'], ARRAY['Diesel', 'Citrus', 'Earthy'], 'A fast-acting sativa with energizing effects. Sour Diesel features a pungent fuel-like aroma and provides a dreamy cerebral effect perfect for creative pursuits.', 'https://images.unsplash.com/photo-1589140915708-20ff89e19947?q=80&w=500&auto=format&fit=crop', TRUE, '00000000-0000-0000-0000-000000000001'),
  
  ('00000000-0000-0000-0000-000000000104', 'Northern Lights', 'Indica', 21.0, 0.4, ARRAY['Relaxed', 'Sleepy', 'Happy', 'Pain Relief'], ARRAY['Sweet', 'Spicy', 'Earthy'], 'A classic indica strain known for its resinous buds and resilience. Northern Lights delivers a deeply relaxing experience with a sweet and spicy aroma.', 'https://images.unsplash.com/photo-1603909223358-5c5f4a3dbef6?q=80&w=500&auto=format&fit=crop', TRUE, '00000000-0000-0000-0000-000000000003'),
  
  ('00000000-0000-0000-0000-000000000105', 'Jack Herer', 'Sativa', 19.0, 0.1, ARRAY['Energetic', 'Creative', 'Focused', 'Uplifted'], ARRAY['Pine', 'Woody', 'Citrus'], 'A sativa-dominant strain named after the cannabis activist. Jack Herer offers a clear-headed, creative experience with a spicy pine scent.', 'https://images.unsplash.com/photo-1603916062198-59391d3330a5?q=80&w=500&auto=format&fit=crop', TRUE, '00000000-0000-0000-0000-000000000004'),
  
  ('00000000-0000-0000-0000-000000000106', 'Pineapple Express', 'Hybrid', 17.0, 0.3, ARRAY['Happy', 'Uplifted', 'Creative', 'Energetic'], ARRAY['Pineapple', 'Tropical', 'Sweet'], 'A tropical-flavored hybrid with a balanced high. Pineapple Express delivers a long-lasting energetic buzz perfect for productive afternoons.', 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?q=80&w=500&auto=format&fit=crop', TRUE, '00000000-0000-0000-0000-000000000005'),
  
  ('00000000-0000-0000-0000-000000000107', 'Girl Scout Cookies', 'Hybrid', 24.0, 0.2, ARRAY['Euphoric', 'Relaxed', 'Happy', 'Creative'], ARRAY['Sweet', 'Earthy', 'Mint'], 'A popular hybrid strain with a sweet and earthy aroma. Girl Scout Cookies delivers a potent combination of full-body relaxation with cerebral euphoria.', 'https://images.unsplash.com/photo-1603916062198-59391d3330a5?q=80&w=500&auto=format&fit=crop', TRUE, '00000000-0000-0000-0000-000000000002'),
  
  ('00000000-0000-0000-0000-000000000108', 'Granddaddy Purple', 'Indica', 20.0, 0.4, ARRAY['Relaxed', 'Sleepy', 'Happy', 'Hungry'], ARRAY['Grape', 'Berry', 'Sweet'], 'A famous indica strain with deep purple buds. Granddaddy Purple delivers a powerful combination of cerebral euphoria and physical relaxation.', 'https://images.unsplash.com/photo-1603916062198-59391d3330a5?q=80&w=500&auto=format&fit=crop', TRUE, '00000000-0000-0000-0000-000000000003');

-- Sample reviews
INSERT INTO reviews (id, user_id, strain_id, rating, review_text, effects, flavors)
VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 4.5, 'Perfect balance of relaxation and creativity. Great for afternoon use!', ARRAY['Relaxed', 'Creative', 'Happy'], ARRAY['Berry', 'Sweet']),
  
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102', 5.0, 'Classic OG Kush. Amazing for stress relief and sleep.', ARRAY['Relaxed', 'Sleepy'], ARRAY['Pine', 'Woody']),
  
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 4.5, 'This strain helped me relax after a long day. Great for evening use.', ARRAY['Relaxed', 'Creative', 'Euphoric'], ARRAY['Diesel', 'Citrus']),
  
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000104', 5.0, 'Absolutely amazing for pain relief. My go-to strain when my back is acting up.', ARRAY['Relaxed', 'Pain Relief', 'Sleepy'], ARRAY['Sweet', 'Spicy']),
  
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000105', 4.0, 'Great for creative work. Helps me focus without feeling too energetic.', ARRAY['Creative', 'Focused', 'Uplifted'], ARRAY['Pine', 'Woody']),
  
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000106', 4.5, 'The flavor is amazing! Tastes just like pineapple and gives a nice balanced high.', ARRAY['Happy', 'Uplifted', 'Creative'], ARRAY['Pineapple', 'Tropical']),
  
  ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000107', 5.0, 'One of the best strains I've tried. Perfect balance of effects and amazing flavor.', ARRAY['Euphoric', 'Relaxed', 'Happy'], ARRAY['Sweet', 'Earthy']),
  
  ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000108', 4.0, 'Great for insomnia. Knocks me right out and I wake up feeling refreshed.', ARRAY['Relaxed', 'Sleepy', 'Happy'], ARRAY['Grape', 'Berry']);

-- Sample favorites
INSERT INTO favorites (user_id, strain_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000107'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000104'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000108'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000105'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000106');

-- Sample lists
INSERT INTO lists (id, user_id, title, description, is_public)
VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', 'My Favorite Strains', 'A collection of my all-time favorites', TRUE),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000002', 'Best for Sleep', 'Strains that help me get a good night''s rest', TRUE),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000003', 'Creative Boosters', 'Great strains for artistic endeavors', TRUE),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000004', 'Pain Relief', 'My go-to strains for managing chronic pain', TRUE),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000005', 'Social Strains', 'Perfect for hanging out with friends', TRUE);

-- Sample list strains
INSERT INTO list_strains (list_id, strain_id)
VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000104'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000108'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000105'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000104'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000108'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000106'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000107');

-- Sample follows
INSERT INTO follows (follower_id, following_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001');

-- Sample list follows
INSERT INTO list_follows (user_id, list_id)
VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000301'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000301'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000302'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000302'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000303'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000304');

-- Sample product preferences
INSERT INTO product_preferences (user_id, preferred_types, preferred_effects, preferred_flavors)
VALUES
  ('00000000-0000-0000-0000-000000000001', ARRAY['Hybrid', 'Sativa'], ARRAY['Creative', 'Happy', 'Relaxed'], ARRAY['Berry', 'Citrus', 'Sweet']),
  ('00000000-0000-0000-0000-000000000002', ARRAY['Indica', 'Hybrid'], ARRAY['Relaxed', 'Sleepy', 'Pain Relief'], ARRAY['Earthy', 'Pine', 'Woody']),
  ('00000000-0000-0000-0000-000000000003', ARRAY['Indica'], ARRAY['Relaxed', 'Sleepy', 'Happy'], ARRAY['Sweet', 'Berry', 'Grape']),
  ('00000000-0000-0000-0000-000000000004', ARRAY['Sativa'], ARRAY['Energetic', 'Creative', 'Focused'], ARRAY['Citrus', 'Pine', 'Tropical']),
  ('00000000-0000-0000-0000-000000000005', ARRAY['Hybrid'], ARRAY['Happy', 'Uplifted', 'Euphoric'], ARRAY['Sweet', 'Tropical', 'Mint']); 
