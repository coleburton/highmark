# Supabase Local Development Setup Instructions

This document provides step-by-step instructions for setting up Supabase locally for the Highmark cannabis app.

## Prerequisites

1. **Install Docker Desktop**
   - Download and install Docker Desktop from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Start Docker Desktop and ensure it's running

2. **Node.js and npm**
   - Ensure you have Node.js installed (already satisfied if you're running the React Native app)

## Setup Steps

1. **Initialize Supabase (Already Done)**
   - We've already initialized Supabase in the project with `npx supabase init`
   - This created the `supabase/` directory with configuration files

2. **Start Supabase Locally**
   - Run the following command to start Supabase:
     ```bash
     npm run supabase:start
     ```
   - This will start all Supabase services locally using Docker
   - The first run may take some time as it downloads the necessary Docker images

3. **Update Environment Variables**
   - After starting Supabase, you'll see output with local credentials
   - Update your `.env` file with these credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
     EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
     ```
   - Uncomment these lines in the `.env` file and comment out the production ones

4. **Access Supabase Studio**
   - Open the Studio URL provided in the output (typically http://localhost:54323)
   - This gives you a web interface to manage your local Supabase instance

5. **Apply Migrations and Seed Data**
   - Run the following command to apply migrations and seed data:
     ```bash
     npm run supabase:reset
     ```
   - This will reset the database and apply all migrations and seed files

## Working with Supabase

### Creating New Migrations

To create a new migration:

```bash
npm run supabase:migration:new your-migration-name
```

This will create a new timestamped SQL file in the `supabase/migrations/` directory.

### Checking Supabase Status

To check the status of your local Supabase services:

```bash
npm run supabase:status
```

### Stopping Supabase

When you're done working, stop the local Supabase instance:

```bash
npm run supabase:stop
```

## Troubleshooting

### Docker Issues

- If you encounter Docker-related errors, ensure Docker Desktop is running
- Try restarting Docker Desktop if services fail to start

### Database Reset Issues

- If you encounter issues with database resets, try stopping Supabase first:
  ```bash
  npm run supabase:stop
  npm run supabase:start
  npm run supabase:reset
  ```

### Connection Issues

- If your app can't connect to Supabase, verify the environment variables are correct
- Check that all Supabase services are running with `npm run supabase:status`

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/) 