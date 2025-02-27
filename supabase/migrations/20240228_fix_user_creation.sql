-- First, drop all existing triggers and functions to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_for_users ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_auth_user();

-- First ensure the profiles table exists with the correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing constraints that might cause issues
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_username_key,
  DROP CONSTRAINT IF EXISTS profiles_email_key,
  DROP CONSTRAINT IF EXISTS username_length,
  DROP CONSTRAINT IF EXISTS valid_email;

-- Add back constraints but make them more flexible
ALTER TABLE profiles
  ADD CONSTRAINT username_length 
    CHECK (username IS NULL OR (char_length(username) >= 3 AND char_length(username) <= 30));

-- Create a function to generate a unique username
CREATE OR REPLACE FUNCTION generate_unique_username(base_username TEXT)
RETURNS TEXT AS $$
DECLARE
  new_username TEXT;
  counter INTEGER := 0;
BEGIN
  new_username := base_username;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || counter::TEXT;
  END LOOP;
  RETURN new_username;
END;
$$ LANGUAGE plpgsql;

-- Create a single, simplified function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Generate base username from email or metadata
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Generate a unique username
  final_username := generate_unique_username(base_username);

  -- Create the profile record
  INSERT INTO profiles (
    id,
    username,
    email,
    avatar_url,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    final_username,
    NEW.email,
    'https://ui-avatars.com/api/?name=' || 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)) || 
    '&background=10B981&color=fff',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error for debugging
  RAISE LOG 'Error in handle_new_user for user_id=%: %', NEW.id, SQLERRM;
  -- Re-raise the exception to prevent the user creation
  RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create a single trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Add RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add a comment to explain what this migration does
COMMENT ON FUNCTION handle_new_user() IS 'Creates a profile record when a new auth user is created with unique username generation';

-- Ensure the profiles table has the correct structure
DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
  END IF;

  -- Make username nullable if it's not already
  ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;
  
  -- Drop the user_id column if it exists (we'll use auth.users.id directly)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
    ALTER TABLE profiles DROP COLUMN user_id;
  END IF;
END $$; 