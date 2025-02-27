-- Create a function to handle user creation in public.users and public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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

    -- Insert into public.profiles if the user doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
        INSERT INTO public.profiles (user_id, first_name, last_name)
        VALUES (
            NEW.id,
            (NEW.raw_user_meta_data->>'first_name')::text,
            (NEW.raw_user_meta_data->>'last_name')::text
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a new trigger to handle user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user(); 