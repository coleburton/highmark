-- Consolidate users and profiles tables
-- First, ensure the users table has all the necessary columns from profiles
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update the handle_new_user function to only use the users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Add exception handling
    BEGIN
        -- Insert into public.users if the user doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
            INSERT INTO public.users (
                id, 
                email, 
                username,
                first_name,
                last_name,
                avatar_url,
                bio
            )
            VALUES (
                NEW.id, 
                NEW.email,
                COALESCE((NEW.raw_user_meta_data->>'username')::text, split_part(NEW.email, '@', 1)),
                COALESCE((NEW.raw_user_meta_data->>'first_name')::text, ''),
                COALESCE((NEW.raw_user_meta_data->>'last_name')::text, ''),
                COALESCE((NEW.raw_user_meta_data->>'avatar_url')::text, ''),
                COALESCE((NEW.raw_user_meta_data->>'bio')::text, '')
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the transaction
        RAISE NOTICE 'Error creating user record: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Add a comment to explain the changes
COMMENT ON FUNCTION public.handle_new_user() IS 'Consolidated function to handle user creation in the users table only';

-- Note: The profiles table will be dropped manually in the Supabase dashboard 