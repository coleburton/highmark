-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the profiles table and related objects first
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create the users table with proper UUID handling
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Set up RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create updated policies
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Trigger can create users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Update the trigger function to handle the new structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
  v_first_name text;
  v_last_name text;
BEGIN
  -- Log the start of the function and the input data
  RAISE LOG 'handle_new_user() started for auth_id: %, email: %, metadata: %', NEW.id, NEW.email, NEW.raw_user_meta_data;

  -- Extract data from raw_user_meta_data
  v_first_name := (NEW.raw_user_meta_data->>'first_name')::text;
  v_last_name := (NEW.raw_user_meta_data->>'last_name')::text;
  v_username := (NEW.raw_user_meta_data->>'username')::text;

  -- If username is not provided, generate one from email
  IF v_username IS NULL THEN
    v_username := split_part(NEW.email, '@', 1);
    RAISE LOG 'Generated username from email: %', v_username;
  END IF;

  -- Create user record
  BEGIN
    INSERT INTO public.users (
      auth_id,
      username, 
      email, 
      first_name, 
      last_name,
      avatar_url,
      bio
    )
    VALUES (
      NEW.id, 
      v_username, 
      NEW.email, 
      v_first_name, 
      v_last_name,
      'https://ui-avatars.com/api/?name=' || COALESCE(v_first_name, '') || '+' || COALESCE(v_last_name, '') || '&background=10B981&color=fff',
      NULL
    );
    RAISE LOG 'Successfully created user record for auth_id: %', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating user record: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Failed to create user record: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role; 