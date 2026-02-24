-- V5: Add Google OAuth support to users table
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
ALTER TABLE users ADD CONSTRAINT uk_users_google_id UNIQUE (google_id);

-- Allow passwordHash to be null (Google users won't have one)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
