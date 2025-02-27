-- Ensure the UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to generate UUIDs for new auth users
CREATE OR REPLACE FUNCTION auth.generate_uuid_for_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set the ID if it's NULL or not provided
  IF NEW.id IS NULL THEN
    NEW.id := uuid_generate_v4();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the function before inserting new users
DROP TRIGGER IF EXISTS generate_uuid_for_users_trigger ON auth.users;
CREATE TRIGGER generate_uuid_for_users_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auth.generate_uuid_for_users();

-- Test the UUID generation
DO $$
BEGIN
  RAISE NOTICE 'UUID generation for auth.users has been configured to use uuid_generate_v4()';
  RAISE NOTICE 'Example UUID: %', uuid_generate_v4();
END;
$$ LANGUAGE plpgsql; 