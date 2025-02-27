-- Ensure the UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update the profiles table to use uuid_generate_v4() for new records
-- Note: Existing profiles are linked to auth.users, so we don't modify those

-- Update the follows table to ensure it uses uuid_generate_v4()
ALTER TABLE follows ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update the list_follows table to ensure it uses uuid_generate_v4()
ALTER TABLE list_follows ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update the product_preferences table to ensure it uses uuid_generate_v4()
ALTER TABLE product_preferences ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update the lists table to ensure it uses uuid_generate_v4()
ALTER TABLE lists ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update the list_strains table to ensure it uses uuid_generate_v4()
ALTER TABLE list_strains ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update the favorites table to ensure it uses uuid_generate_v4()
ALTER TABLE favorites ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update the reviews table to ensure it uses uuid_generate_v4()
ALTER TABLE reviews ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update the strains table to ensure it uses uuid_generate_v4()
ALTER TABLE strains ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Create a function to verify UUID format
CREATE OR REPLACE FUNCTION is_valid_uuid(text) RETURNS BOOLEAN AS $$
BEGIN
  RETURN $1 ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
EXCEPTION
  WHEN others THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a check constraint to ensure UUIDs are in the correct format
DO $$
DECLARE
  table_name text;
  column_name text;
BEGIN
  FOR table_name, column_name IN
    SELECT t.table_name, c.column_name
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
    AND c.data_type = 'uuid'
    AND c.column_name = 'id'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I_uuid_format', 
                  table_name, column_name);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_uuid_format 
                  CHECK (is_valid_uuid(%I::text))', 
                  table_name, column_name, column_name);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Test the UUID generation to ensure it's in the correct format
DO $$
DECLARE
  test_uuid uuid;
BEGIN
  test_uuid := uuid_generate_v4();
  RAISE NOTICE 'Generated UUID: %', test_uuid;
  
  IF NOT is_valid_uuid(test_uuid::text) THEN
    RAISE EXCEPTION 'Generated UUID does not match the required format';
  END IF;
END;
$$ LANGUAGE plpgsql; 