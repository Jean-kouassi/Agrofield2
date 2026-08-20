-- Migration: Fix Storage Policies for Marketplace Images
-- Date: 2026-08-19 14:00
-- Issue: Photos uploaded to agrofield-media bucket may be blocked by RLS
-- Solution: Create permissive policies for authenticated uploads and public reads

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agrofield-media', 
  'agrofield-media', 
  true, -- Public bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own files" ON storage.objects;

-- Policy 1: Authenticated users can INSERT into their own folder
CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = 'marketplace'
  AND owner = auth.uid()
);

-- Policy 2: Anyone can SELECT (read) from the bucket
CREATE POLICY "Public access to marketplace images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'agrofield-media');

-- Policy 3: Users can DELETE their own files
CREATE POLICY "Users can delete own marketplace images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'agrofield-media'
  AND owner = auth.uid()
);

-- Policy 4: Users can UPDATE their own files (for upsert scenarios)
CREATE POLICY "Users can update own marketplace images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'agrofield-media'
  AND owner = auth.uid()
);

-- Add comments for documentation
COMMENT ON POLICY "Authenticated users can upload marketplace images" ON storage.objects IS 
  'Allows authenticated users to upload images to their marketplace folder';
COMMENT ON POLICY "Public access to marketplace images" ON storage.objects IS 
  'Allows anyone to view marketplace images (needed for public listing pages)';
