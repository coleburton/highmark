# Supabase Database Management Scripts

This directory contains scripts for managing the Supabase database.

## Prerequisites

Before running these scripts, make sure you have:

1. Node.js installed
2. The required environment variables set in a `.env` file at the root of the project:
   - `SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_URL`
   - `SUPABASE_KEY` or `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY` (for admin operations)

## Available Scripts

### Add Featured Column to Strains Table

This script adds a `featured` boolean column to the strains table if it doesn't already exist.

```bash
node scripts/add-featured-column.js
```

**Note:** This script requires the `SUPABASE_SERVICE_KEY` with admin privileges. If the script fails, you may need to add the column manually in the Supabase dashboard using SQL:

```sql
ALTER TABLE strains ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
```

### Update Featured Strains

This script marks a few strains as featured by setting their `featured` flag to `true`.

```bash
node scripts/update-featured-strains.js
```

This script will:
1. Fetch up to 10 approved strains
2. Mark up to 5 of them as featured
3. Verify the update

## Troubleshooting

If you encounter any issues:

1. Make sure your environment variables are correctly set
2. Check that you have the necessary permissions in Supabase
3. For column additions, you may need to use the Supabase dashboard SQL editor 