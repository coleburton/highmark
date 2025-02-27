# Supabase User Creation Diagnostic Tools

This directory contains a set of diagnostic tools to help identify and fix issues with user creation in Supabase.

## Background

The error message `column users.email does not exist` indicates that there's a mismatch between the database schema and the code that's trying to access it. These tools will help diagnose and fix the issue.

## Available Tools

1. **check-db-schema.js** - Checks the database schema to identify issues with tables and columns
2. **debug-user-creation.js** - Tests the user creation process with detailed logging
3. **fix-users-table.js** - Attempts to fix the users table by adding the missing email column
4. **diagnose-and-fix.js** - Comprehensive tool that checks the schema, attempts to fix issues, and tests user creation
5. **run-diagnostics.sh** - Shell script to run all the diagnostic tools

## Prerequisites

- Node.js installed
- Supabase project credentials (already included in the scripts)

## How to Use

### Option 1: Run the Shell Script

The easiest way to run the diagnostic tools is to use the shell script:

```bash
./run-diagnostics.sh
```

This will present a menu where you can choose which diagnostic tool to run.

### Option 2: Run Individual Scripts

You can also run each script individually:

```bash
node check-db-schema.js
node debug-user-creation.js
node fix-users-table.js
node diagnose-and-fix.js
```

## Understanding the Results

Each script will output detailed information about the database schema, user creation process, and any issues found. The most common issues are:

1. **Missing email column** - The users table is missing the email column that the code is trying to access
2. **Missing trigger** - There's no trigger on auth.users to create a corresponding record in the users table
3. **Incorrect trigger function** - The trigger function doesn't correctly handle the email field

## Fixing the Issues

The `fix-users-table.js` script will attempt to add the missing email column to the users table. If this doesn't resolve the issue, you may need to:

1. Check if the trigger function needs to be updated to include the email field
2. Ensure the users table has the correct structure (id, auth_id, email, etc.)
3. Verify that the trigger on auth.users is correctly set up

## Logs

Each script will create a log file with the same name as the script (e.g., `check-db-schema.js.log`). These logs can be helpful for troubleshooting.

## Next Steps

If the diagnostic tools don't resolve the issue, you may need to:

1. Check the Supabase migration files to ensure they're correctly setting up the database schema
2. Verify that the code is using the correct column names when accessing the database
3. Consider recreating the users table with the correct schema

## Support

If you continue to experience issues, please contact the development team with the log files from these diagnostic tools. 