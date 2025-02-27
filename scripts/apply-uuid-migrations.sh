#!/bin/bash

# This script applies the UUID migration files to ensure all tables use uuid_generate_v4()

echo "Applying UUID migrations to Supabase..."

# Start Supabase if it's not already running
if ! npx supabase status | grep -q "Started"; then
  echo "Starting Supabase..."
  npx supabase start
fi

# Apply the migrations
echo "Applying migration: 20240501000000_update_uuid_generation.sql"
npx supabase db query --file ./supabase/migrations/20240501000000_update_uuid_generation.sql

echo "Applying migration: 20240501000001_update_auth_users_uuid.sql"
npx supabase db query --file ./supabase/migrations/20240501000001_update_auth_users_uuid.sql

# Test UUID generation
echo "Testing UUID generation..."
UUID=$(npx supabase db query "SELECT uuid_generate_v4();" --csv | tail -n 1)
echo "Generated UUID: $UUID"

# Verify the format
if [[ $UUID =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  echo "✅ UUID format is correct!"
else
  echo "❌ UUID format is incorrect: $UUID"
  exit 1
fi

echo "UUID migrations applied successfully!"
echo "All tables will now use the format: 9fcd6693-a228-4b38-bcb4-4f7f86afeef6" 