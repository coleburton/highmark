-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a function to log debug information
CREATE OR REPLACE FUNCTION log_debug(message TEXT)
RETURNS void AS $$
BEGIN
  RAISE LOG 'DEBUG: %', message;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate a unique username with logging
CREATE OR REPLACE FUNCTION generate_unique_username(base_username TEXT)
RETURNS TEXT AS $$
DECLARE
  new_username TEXT;
  counter INTEGER := 0;
BEGIN
  PERFORM log_debug('Generating unique username from base: ' || base_username);
  
  -- Start with the base username
  new_username := base_username;
  
  -- Keep trying until we find a unique username
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || counter::TEXT;
    PERFORM log_debug('Username ' || base_username || ' taken, trying: ' || new_username);
  END LOOP;
  
  PERFORM log_debug('Final username generated: ' || new_username);
  RETURN new_username;
END;
$$ LANGUAGE plpgsql;

-- Create an enhanced handle_new_user function with detailed logging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id BIGINT;
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Log the start of user creation
  PERFORM log_debug('Starting user creation process for auth.id: ' || NEW.id);
  PERFORM log_debug('Email: ' || COALESCE(NEW.email, 'null'));
  PERFORM log_debug('Raw metadata: ' || COALESCE(NEW.raw_user_meta_data::TEXT, 'null'));

  -- Generate base username from email if not provided
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  PERFORM log_debug('Base username determined: ' || base_username);
  
  -- Generate a unique username
  final_username := generate_unique_username(base_username);
  PERFORM log_debug('Final username generated: ' || final_username);

  BEGIN
    -- First, create the user record
    PERFORM log_debug('Attempting to create user record');
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
    
    PERFORM log_debug('User record created successfully with ID: ' || new_user_id::TEXT);
  EXCEPTION WHEN OTHERS THEN
    PERFORM log_debug('Error creating user record: ' || SQLERRM);
    PERFORM log_debug('Error details - SQLSTATE: ' || SQLSTATE);
    RAISE EXCEPTION 'Failed to create user record: %', SQLERRM;
  END;

  BEGIN
    -- Then create the profile with the user_id
    PERFORM log_debug('Attempting to create profile record');
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
    
    PERFORM log_debug('Profile record created successfully');
  EXCEPTION WHEN OTHERS THEN
    PERFORM log_debug('Error creating profile record: ' || SQLERRM);
    PERFORM log_debug('Error details - SQLSTATE: ' || SQLSTATE);
    RAISE EXCEPTION 'Failed to create profile record: %', SQLERRM;
  END;

  PERFORM log_debug('User creation process completed successfully');
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error and re-raise
  PERFORM log_debug('Unhandled error in handle_new_user: ' || SQLERRM);
  PERFORM log_debug('Error details - SQLSTATE: ' || SQLSTATE);
  PERFORM log_debug('Error details - PG_EXCEPTION_DETAIL: ' || COALESCE(PG_EXCEPTION_DETAIL, 'null'));
  PERFORM log_debug('Error details - PG_EXCEPTION_HINT: ' || COALESCE(PG_EXCEPTION_HINT, 'null'));
  PERFORM log_debug('Error details - PG_EXCEPTION_CONTEXT: ' || COALESCE(PG_EXCEPTION_CONTEXT, 'null'));
  RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Add a comment to explain the purpose of this migration
COMMENT ON FUNCTION handle_new_user() IS 'Creates both user and profile records when a new auth user is created, with detailed logging'; 