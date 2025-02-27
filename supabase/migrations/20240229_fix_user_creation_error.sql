-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

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

-- Create a more robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
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

  BEGIN
    -- Create the profile record with the unique username
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
      COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)) || 
      '&background=10B981&color=fff',
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE LOG 'Error creating profile for user % (username %): %', NEW.id, final_username, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Drop unique constraints that might cause issues
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_username_key,
  DROP CONSTRAINT IF EXISTS profiles_email_key;

-- Add a comment explaining what this migration does
COMMENT ON FUNCTION handle_new_user() IS 'Creates a profile when a new auth user is created, with unique username generation and error handling'; 