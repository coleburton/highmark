-- Create a sequence for user IDs
CREATE SEQUENCE IF NOT EXISTS user_id_seq START 1000;

-- Create users table with numeric IDs
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY DEFAULT nextval('user_id_seq'),
  auth_id UUID REFERENCES auth.users(id) NOT NULL,
  username VARCHAR(30) UNIQUE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT username_length CHECK (username IS NULL OR (char_length(username) >= 3 AND char_length(username) <= 30))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Create a trigger to automatically set the updated_at field
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Create a trigger to automatically create a user entry when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rename the trigger to avoid conflict with the existing one
CREATE TRIGGER on_auth_user_created_for_users
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_auth_user();

-- Set up Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Update the profiles table to reference the new users table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);

-- Create a function to update existing profiles with user_id
CREATE OR REPLACE FUNCTION update_existing_profiles()
RETURNS VOID AS $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT p.id, u.id as user_id FROM profiles p JOIN users u ON p.id = u.auth_id
  LOOP
    UPDATE profiles SET user_id = profile_record.user_id WHERE id = profile_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to update existing profiles
SELECT update_existing_profiles();

-- Drop the function as it's no longer needed
DROP FUNCTION update_existing_profiles();

-- Update the handle_new_user function to work with the new users table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  retry_count INTEGER := 0;
  max_retries CONSTANT INTEGER := 3;
BEGIN
  -- Try to get the user_id from the users table with retries to handle potential race conditions
  LOOP
    SELECT id INTO user_record FROM users WHERE auth_id = NEW.id;
    
    -- If we found the user, break out of the loop
    IF user_record.id IS NOT NULL THEN
      EXIT;
    END IF;
    
    -- If we've reached max retries, create the user record manually
    IF retry_count >= max_retries THEN
      INSERT INTO users (auth_id) VALUES (NEW.id) RETURNING id INTO user_record;
      EXIT;
    END IF;
    
    -- Wait a short time and increment retry counter
    PERFORM pg_sleep(0.1);
    retry_count := retry_count + 1;
  END LOOP;
  
  -- Now create the profile with the user_id
  INSERT INTO profiles (id, username, email, avatar_url, user_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    'https://ui-avatars.com/api/?name=' || 
    COALESCE(NEW.raw_user_meta_data->>'username', 'User') || 
    '&background=10B981&color=fff',
    user_record.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 