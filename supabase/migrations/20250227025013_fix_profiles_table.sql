-- Check if the profiles table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- Create the profiles table if it doesn't exist
        CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            username TEXT UNIQUE,
            email TEXT,
            avatar_url TEXT,
            bio TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id BIGINT REFERENCES users(id)
        );

        -- Set up RLS policies
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Public profiles are viewable by everyone."
            ON profiles FOR SELECT
            USING (true);

        CREATE POLICY "Users can insert their own profile."
            ON profiles FOR INSERT
            WITH CHECK (auth.uid() = id);

        CREATE POLICY "Users can update their own profile."
            ON profiles FOR UPDATE
            USING (auth.uid() = id);
    ELSE
        -- Make sure the user_id column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE profiles ADD COLUMN user_id BIGINT REFERENCES users(id);
        END IF;
    END IF;
END
$$;

-- Fix the handle_new_user function to properly handle user creation
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
  
  -- Now create the profile with the user_id
  BEGIN
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

-- Add a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();
