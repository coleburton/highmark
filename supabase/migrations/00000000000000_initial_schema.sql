-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create a trigger to automatically set the updated_at field
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    'https://ui-avatars.com/api/?name=' || 
    (NEW.raw_user_meta_data->>'username') || 
    '&background=10B981&color=fff'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- 2. Strains Table
CREATE TYPE strain_type AS ENUM ('Indica', 'Sativa', 'Hybrid', 'Other');

CREATE TABLE strains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type strain_type NOT NULL,
  thc_percentage DECIMAL(5,2),
  cbd_percentage DECIMAL(5,2),
  effects TEXT[] DEFAULT '{}',
  flavors TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  submitted_by UUID REFERENCES profiles(id),
  approved BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT name_unique UNIQUE (name),
  CONSTRAINT valid_thc CHECK (thc_percentage >= 0 AND thc_percentage <= 100),
  CONSTRAINT valid_cbd CHECK (cbd_percentage >= 0 AND cbd_percentage <= 100)
);

-- Create index for faster searches
CREATE INDEX idx_strains_name ON strains USING gin (to_tsvector('english', name));
CREATE INDEX idx_strains_type ON strains (type);
CREATE INDEX idx_strains_effects ON strains USING gin (effects);
CREATE INDEX idx_strains_flavors ON strains USING gin (flavors);

-- 3. Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  strain_id UUID REFERENCES strains(id) NOT NULL,
  rating DECIMAL(3,1) NOT NULL,
  review_text TEXT,
  effects TEXT[] DEFAULT '{}',
  flavors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT one_review_per_user_strain UNIQUE (user_id, strain_id)
);

-- Create a trigger to automatically set the updated_at field
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at_trigger
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();

-- Create indexes for faster queries
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_strain_id ON reviews(strain_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- 4. Lists Table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 100)
);

-- Create a trigger to automatically set the updated_at field
CREATE OR REPLACE FUNCTION update_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lists_updated_at_trigger
BEFORE UPDATE ON lists
FOR EACH ROW
EXECUTE FUNCTION update_lists_updated_at();

-- Create index for faster queries
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_is_public ON lists(is_public);

-- 5. List Strains Table
CREATE TABLE list_strains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  strain_id UUID REFERENCES strains(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_list_strain UNIQUE (list_id, strain_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_list_strains_list_id ON list_strains(list_id);
CREATE INDEX idx_list_strains_strain_id ON list_strains(strain_id);

-- 6. Favorites Table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  strain_id UUID REFERENCES strains(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_user_strain_favorite UNIQUE (user_id, strain_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_strain_id ON favorites(strain_id);

-- 7. Follows Table
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- 8. List Follows Table
CREATE TABLE list_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_list_follow UNIQUE (user_id, list_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_list_follows_user_id ON list_follows(user_id);
CREATE INDEX idx_list_follows_list_id ON list_follows(list_id);

-- 9. Product Preferences Table
CREATE TABLE product_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  preferred_types TEXT[] DEFAULT '{}',
  preferred_effects TEXT[] DEFAULT '{}',
  preferred_flavors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Create a trigger to automatically set the updated_at field
CREATE OR REPLACE FUNCTION update_product_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_preferences_updated_at_trigger
BEFORE UPDATE ON product_preferences
FOR EACH ROW
EXECUTE FUNCTION update_product_preferences_updated_at();

-- Create index for faster queries
CREATE INDEX idx_product_preferences_user_id ON product_preferences(user_id);

-- Set up Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Strains policies
CREATE POLICY "Strains are viewable by everyone"
  ON strains FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert strains"
  ON strains FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update strains they submitted"
  ON strains FOR UPDATE
  USING (auth.uid() = submitted_by)
  WITH CHECK (auth.uid() = submitted_by);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Lists policies
CREATE POLICY "Public lists are viewable by everyone"
  ON lists FOR SELECT
  USING (is_public OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert lists"
  ON lists FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON lists FOR DELETE
  USING (auth.uid() = user_id);

-- List strains policies
CREATE POLICY "List strains are viewable by everyone if the list is public"
  ON list_strains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND (lists.is_public OR lists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert strains into their own lists"
  ON list_strains FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete strains from their own lists"
  ON list_strains FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND lists.user_id = auth.uid()
    )
  );

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can view follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert follows"
  ON follows FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- List follows policies
CREATE POLICY "Users can view list follows"
  ON list_follows FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert list follows"
  ON list_follows FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own list follows"
  ON list_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Product preferences policies
CREATE POLICY "Users can view their own product preferences"
  ON product_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert product preferences"
  ON product_preferences FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own product preferences"
  ON product_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); 