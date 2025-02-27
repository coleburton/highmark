-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_for_users ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_auth_user();

-- Create a function to generate a unique username
CREATE OR REPLACE FUNCTION generate_unique_username(base_username TEXT)
RETURNS TEXT AS $$
DECLARE
  new_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Start with the base username
  new_username := base_username;
  
  -- Keep trying until we find a unique username
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || counter::TEXT;
  END LOOP;
  
  RETURN new_username;
END;
$$ LANGUAGE plpgsql;

-- Create a single, robust function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id BIGINT;
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Generate base username from email if not provided
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Generate a unique username
  final_username := generate_unique_username(base_username);

  -- First, create the user record
  INSERT INTO users (
    auth_id,
    username,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    final_username,
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
    final_username,
    NEW.email,
    'https://ui-avatars.com/api/?name=' || 
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)) || 
    '&background=10B981&color=fff',
    new_user_id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error for debugging
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  -- Re-raise the exception to prevent the user creation
  RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create a single trigger for user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Add a comment to explain the purpose of this migration
COMMENT ON FUNCTION handle_new_user() IS 'Creates both user and profile records when a new auth user is created'; 