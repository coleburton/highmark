-- Add first_name and last_name columns to the profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update the handle_new_user function to include first_name and last_name
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

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
  
  -- Now create the profile with the user_id and name fields
  BEGIN
    INSERT INTO profiles (id, username, email, avatar_url, user_id, first_name, last_name)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'username',
      NEW.email,
      'https://ui-avatars.com/api/?name=' || 
      COALESCE(NEW.raw_user_meta_data->>'username', 'User') || 
      '&background=10B981&color=fff',
      user_record.id,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger again
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
