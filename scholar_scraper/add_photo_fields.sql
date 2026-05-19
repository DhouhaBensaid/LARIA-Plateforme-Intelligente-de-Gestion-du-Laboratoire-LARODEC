-- Add photo and google_scholar_url fields to larodec_users table
ALTER TABLE larodec_users 
ADD COLUMN IF NOT EXISTS photo BYTEA DEFAULT NULL,
ADD COLUMN IF NOT EXISTS photo_filename TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS google_scholar_url TEXT DEFAULT NULL;
