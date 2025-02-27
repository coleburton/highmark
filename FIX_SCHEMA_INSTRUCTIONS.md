# Fix Schema Instructions

## Problem

The application is experiencing errors when creating new users, specifically:

```
column users.email does not exist
```

After analyzing the database schema, we've identified that:

1. The application has both `profiles` and `users` tables in the public schema
2. The `profiles` table contains the email field, but the `users` table doesn't
3. Parts of the application are trying to access `users.email` which doesn't exist
4. The auth trigger is likely creating records in both tables, causing confusion

## Solution

We need to:

1. Add the missing `email` column to the `users` table
2. Update the trigger function to include the email field when creating new users
3. Migrate existing data from `profiles.email` to `users.email`

## Instructions

### Option 1: Run the SQL Script in Supabase

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of the `fix-schema.sql` file
4. Run the SQL commands

### Option 2: Manual Steps

If you prefer to run the commands individually:

1. Add the email column to the users table:
   ```sql
   ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
   ```

2. Update the trigger function to include the email field:
   ```sql
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
   ```

3. Ensure the trigger is properly set up:
   ```sql
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

   CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW
   EXECUTE FUNCTION public.handle_new_user();
   ```

4. Migrate data from profiles to users:
   ```sql
   UPDATE public.users u
   SET email = p.email
   FROM public.profiles p
   WHERE u.id = p.id
     AND u.email IS NULL
     AND p.email IS NOT NULL;
   ```

## Verification

After applying the changes, you can verify they were applied correctly:

1. Check if the email column exists in the users table:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'users' 
     AND column_name = 'email';
   ```

2. Check if the trigger function exists:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

3. Check if the trigger exists:
   ```sql
   SELECT trigger_name 
   FROM information_schema.triggers 
   WHERE event_object_schema = 'auth' 
     AND event_object_table = 'users' 
     AND trigger_name = 'on_auth_user_created';
   ```

## Long-term Solution

For a more comprehensive solution, you might want to:

1. Consolidate the `profiles` and `users` tables into a single table
2. Update all references in your code to use only the `users` table
3. Drop the `profiles` table if it's no longer needed

This would simplify your database schema and prevent similar issues in the future. 