# Supabase Database Structure for Highmark Cannabis App

This document outlines the database structure for the Highmark cannabis strain review application. The database is designed to support user authentication, strain information, reviews, user lists, favorites, and social features.

## Table Structure

### 1. `profiles` Table
Extends the default Supabase auth.users table with additional user profile information.

```sql
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
```

### 2. `strains` Table
Stores information about cannabis strains.

```sql
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
CREATE INDEX idx_strains_name ON strains USING GIN (name gin_trgm_ops);
CREATE INDEX idx_strains_type ON strains (type);
CREATE INDEX idx_strains_effects ON strains USING GIN (effects);
CREATE INDEX idx_strains_flavors USING GIN (flavors);
```

### 3. `reviews` Table
Stores user reviews of strains.

```sql
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
```

### 4. `lists` Table
Stores user-created lists of strains.

```sql
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
```

### 5. `list_strains` Table
Junction table for many-to-many relationship between lists and strains.

```sql
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
```

### 6. `favorites` Table
Stores user's favorite strains.

```sql
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
```

### 7. `follows` Table
Stores user follow relationships.

```sql
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
```

### 8. `list_follows` Table
Stores user follows for lists.

```sql
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
```

### 9. `product_preferences` Table
Stores user product preferences from onboarding.

```sql
CREATE TABLE product_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  preferred_types TEXT[] DEFAULT '{}',
  preferred_effects TEXT[] DEFAULT '{}',
  preferred_flavors TEXT[] DEFAULT '{}',
  thc_preference TEXT,
  cbd_preference TEXT,
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
```

## Row-Level Security (RLS) Policies

To secure your data, implement the following RLS policies:

### Profiles Table

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view any profile
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT USING (true);

-- Allow users to update only their own profile
CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Strains Table

```sql
-- Enable RLS
ALTER TABLE strains ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view approved strains
CREATE POLICY strains_select_policy ON strains
  FOR SELECT USING (approved = true OR submitted_by = auth.uid());

-- Allow authenticated users to insert strains
CREATE POLICY strains_insert_policy ON strains
  FOR INSERT TO authenticated USING (true)
  WITH CHECK (submitted_by = auth.uid());

-- Allow users to update only their own unapproved strains
CREATE POLICY strains_update_policy ON strains
  FOR UPDATE USING (submitted_by = auth.uid() AND approved = false);

-- Create admin policy for managing all strains (implement after adding admin role)
-- CREATE POLICY strains_admin_policy ON strains
--   FOR ALL TO authenticated USING (is_admin());
```

### Reviews Table

```sql
-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view reviews
CREATE POLICY reviews_select_policy ON reviews
  FOR SELECT USING (true);

-- Allow authenticated users to insert reviews
CREATE POLICY reviews_insert_policy ON reviews
  FOR INSERT TO authenticated USING (true)
  WITH CHECK (user_id = auth.uid());

-- Allow users to update only their own reviews
CREATE POLICY reviews_update_policy ON reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Allow users to delete only their own reviews
CREATE POLICY reviews_delete_policy ON reviews
  FOR DELETE USING (user_id = auth.uid());
```

Apply similar RLS policies to the remaining tables to ensure data security.

## Functions and Stored Procedures

### Get Strain with Average Rating

```sql
CREATE OR REPLACE FUNCTION get_strain_with_rating(strain_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type strain_type,
  thc_percentage DECIMAL(5,2),
  cbd_percentage DECIMAL(5,2),
  effects TEXT[],
  flavors TEXT[],
  images TEXT[],
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID,
  approved BOOLEAN,
  avg_rating DECIMAL(3,2),
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.type,
    s.thc_percentage,
    s.cbd_percentage,
    s.effects,
    s.flavors,
    s.images,
    s.image_url,
    s.description,
    s.created_at,
    s.submitted_by,
    s.approved,
    COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as avg_rating,
    COUNT(r.id) as review_count
  FROM strains s
  LEFT JOIN reviews r ON s.id = r.strain_id
  WHERE s.id = strain_uuid
  GROUP BY s.id;
END;
$$ LANGUAGE plpgsql;
```

### Get User's Favorite Strains

```sql
CREATE OR REPLACE FUNCTION get_user_favorites(user_uuid UUID)
RETURNS TABLE (
  strain_id UUID,
  name TEXT,
  type strain_type,
  image_url TEXT,
  avg_rating DECIMAL(3,2),
  favorite_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as strain_id,
    s.name,
    s.type,
    s.image_url,
    COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as avg_rating,
    f.id as favorite_id,
    f.created_at
  FROM favorites f
  JOIN strains s ON f.strain_id = s.id
  LEFT JOIN reviews r ON s.id = r.strain_id
  WHERE f.user_id = user_uuid
  GROUP BY s.id, f.id
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

## Indexes and Performance Considerations

1. Add GIN indexes for text search on strain names and descriptions:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_strains_name_trgm ON strains USING GIN (name gin_trgm_ops);
CREATE INDEX idx_strains_description_trgm ON strains USING GIN (description gin_trgm_ops);
```

2. Add indexes for commonly filtered fields:
```sql
CREATE INDEX idx_strains_thc ON strains (thc_percentage);
CREATE INDEX idx_strains_cbd ON strains (cbd_percentage);
```

3. Consider adding materialized views for frequently accessed aggregated data:
```sql
CREATE MATERIALIZED VIEW strain_ratings AS
SELECT 
  s.id,
  s.name,
  s.type,
  COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as avg_rating,
  COUNT(r.id) as review_count
FROM strains s
LEFT JOIN reviews r ON s.id = r.strain_id
GROUP BY s.id, s.name, s.type;

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_strain_ratings()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY strain_ratings;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the materialized view
CREATE TRIGGER refresh_strain_ratings_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_strain_ratings();
```

## Supabase Setup Instructions

1. Create a new Supabase project
2. Set up authentication providers (email, social logins)
3. Run the SQL scripts to create tables, functions, and policies
4. Configure storage buckets for user avatars and strain images
5. Set up edge functions for any complex operations
6. Configure webhooks for external integrations if needed

## Recommended Supabase Extensions

- `pg_trgm` - For text search functionality
- `uuid-ossp` - For UUID generation
- `pgcrypto` - For cryptographic functions

## Backup and Maintenance

1. Schedule regular database backups
2. Set up monitoring for database performance
3. Implement a database migration strategy for future schema changes 