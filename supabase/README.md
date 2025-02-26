# Supabase Local Development Setup

This directory contains the configuration and migration files for the Highmark cannabis app's Supabase backend.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) - Required for running Supabase locally
- [Node.js](https://nodejs.org/) - Required for running the Supabase CLI

## Directory Structure

- `migrations/` - Contains SQL migration files for database schema
- `seed/` - Contains SQL seed files for populating the database with initial data
- `config.toml` - Configuration file for Supabase

## Getting Started

1. Install Docker Desktop and ensure it's running
2. Start the local Supabase instance:

```bash
npx supabase start
```

This will start all Supabase services locally, including:
- PostgreSQL database
- Auth service
- Storage service
- API service

3. Once started, you'll see URLs and credentials for accessing the local services:
   - Studio URL (for admin dashboard)
   - API URL (for your app to connect to)
   - DB URL (for direct database access)
   - JWT secret (for authentication)

4. Update your `.env` file with the local development credentials:

```
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
```

## Database Migrations

The database schema is defined in the `migrations/` directory. When you start Supabase locally, these migrations will be applied automatically.

To create a new migration:

```bash
npx supabase migration new <migration-name>
```

This will create a new timestamped SQL file in the `migrations/` directory.

## Seeding Data

To seed the database with initial data:

```bash
npx supabase db reset
```

This will reset the database and apply all migrations and seed files.

## Stopping Supabase

To stop the local Supabase instance:

```bash
npx supabase stop
```

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/) 