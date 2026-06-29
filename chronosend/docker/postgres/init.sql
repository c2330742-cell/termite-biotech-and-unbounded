-- ChronoSend PostgreSQL Initialization Script
-- Creates the database user and initial schema

-- This script runs on the default 'postgres' database to ensure the
-- chronosend database and user exist. The actual schema migrations
-- are applied by the migration script in apps/server/src/db/migrate.ts

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
