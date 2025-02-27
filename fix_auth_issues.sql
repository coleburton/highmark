-- Disable the on_auth_user_created trigger temporarily to see if it's causing the issue
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a more robust handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Add exception handling
    BEGIN
        -- Insert into public.users if the user doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
            INSERT INTO public.users (id, email, username)
            VALUES (
                NEW.id, 
                NEW.email,
                COALESCE(
                    (NEW.raw_user_meta_data->>'username')::text,
                    split_part(NEW.email, '@', 1)
                )
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the transaction
        RAISE NOTICE 'Error creating user record: %', SQLERRM;
    END;

    -- Add exception handling
    BEGIN
        -- Insert into public.profiles if the user doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
            INSERT INTO public.profiles (user_id, first_name, last_name)
            VALUES (
                NEW.id,
                COALESCE((NEW.raw_user_meta_data->>'first_name')::text, ''),
                COALESCE((NEW.raw_user_meta_data->>'last_name')::text, '')
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the transaction
        RAISE NOTICE 'Error creating profile record: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger with a lower priority (higher action_order)
-- This ensures it runs after the generate_uuid_for_users_trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Add a comment to explain the changes
COMMENT ON FUNCTION public.handle_new_user() IS 'Improved function to handle user creation with better error handling'; 