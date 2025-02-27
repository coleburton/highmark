-- First, drop all existing triggers on auth.users to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_for_users ON auth.users;

-- Drop the existing functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_auth_user();

-- Create a single, robust function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id BIGINT;
BEGIN
  -- First, create the user record in the users table
  INSERT INTO users (
    auth_id, 
    username, 
    first_name, 
    last_name
  ) VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'username', 
    NEW.raw_user_meta_data->>'first_name', 
    NEW.raw_user_meta_data->>'last_name'
  ) RETURNING id INTO new_user_id;
  
  -- Then create the profile with the user_id
  INSERT INTO profiles (
    id, 
    username, 
    email, 
    avatar_url, 
    user_id,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    'https://ui-avatars.com/api/?name=' || 
    COALESCE(NEW.raw_user_meta_data->>'username', 'User') || 
    '&background=10B981&color=fff',
    new_user_id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a single trigger for user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Add a comment to explain the purpose of this migration
COMMENT ON FUNCTION handle_new_user() IS 'Creates a user record and profile when a new auth user is created';
