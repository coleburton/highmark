-- SQL script to fix schema issues with users table and trigger function

-- Step 1: Add email column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Step 2: Update trigger function to include email field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
  v_first_name text;
  v_last_name text;
BEGIN
  -- Extract data from raw_user_meta_data
  v_first_name := (NEW.raw_user_meta_data->>'first_name')::text;
  v_last_name := (NEW.raw_user_meta_data->>'last_name')::text;
  v_username := (NEW.raw_user_meta_data->>'username')::text;
  
  -- If username is not provided, generate one from email
  IF v_username IS NULL THEN
    v_username := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Insert into users table
  BEGIN
    INSERT INTO public.users (
      id,
      username,
      email,
      first_name,
      last_name,
      created_at
    ) VALUES (
      NEW.id,
      v_username,
      NEW.email,
      v_first_name,
      v_last_name,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating user record: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Migrate data from profiles to users (if needed)
-- This will copy email values from profiles to users for existing records
UPDATE public.users u
SET email = p.email
FROM public.profiles p
WHERE u.id = p.id
  AND u.email IS NULL
  AND p.email IS NOT NULL;

-- Step 5: Verify the changes
-- Run these commands separately to check if the changes were applied correctly

-- Check if email column exists in users table
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email';

-- Check if trigger function exists
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if trigger exists
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users' AND trigger_name = 'on_auth_user_created'; 