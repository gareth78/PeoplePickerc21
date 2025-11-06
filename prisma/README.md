# Prisma Database Setup

This directory contains the Prisma ORM configuration for the People Picker application.

## Database

- **Provider**: PostgreSQL
- **Connection**: Azure Database for PostgreSQL (North Europe)
- **Environment Variable**: `DATABASE_URL`

## Schema

The database schema is defined in `schema.prisma` and includes:

- **Admin model**: Stores administrator user information with email, creation timestamp, and creator reference

## Migrations

Migrations are stored in `prisma/migrations/` and are applied automatically when running:

```bash
npx prisma migrate deploy
```

For development migrations:

```bash
npx prisma migrate dev
```

## Generating Prisma Client

After schema changes, regenerate the Prisma Client:

```bash
npx prisma generate
```

The Prisma Client is imported in the application via `lib/prisma.ts`.

## Notes

- The initial migration creates the `admins` table
- Prisma Client generation requires internet access to download engine binaries
- In environments with network restrictions, the client generation will occur during the first deployment with proper network access
