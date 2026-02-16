-- =============================================================
-- NextIntern.ai — Postgres Initialization Script
-- Runs once on first container start.
-- Creates the read-only role for the recs service.
-- =============================================================

-- Create read-only role for recs service
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'recs_readonly') THEN
    CREATE ROLE recs_readonly WITH LOGIN PASSWORD 'recs_readonly_dev';
  END IF;
END
$$;

-- Grant connect and read-only permissions
GRANT CONNECT ON DATABASE nextintern TO recs_readonly;

-- These grants will be applied after tables are created (by Flyway).
-- We use default privileges so future tables are also readable.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO recs_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO recs_readonly;
