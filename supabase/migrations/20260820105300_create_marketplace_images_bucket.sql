-- Migration: Create marketplace-images bucket for product photos
-- Date: 2026-08-20 10:53
-- Purpose: Dedicated bucket for marketplace listing images, separate from finance receipts

-- Ensure the marketplace-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images', 
  'marketplace-images', 
  true, -- Public bucket for product photos
  10485760, -- 10MB limit (higher quality product photos)
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Marketplace: Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Marketplace: Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Marketplace: Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Marketplace: Users can update own images" ON storage.objects;

-- Policy 1: Authenticated users can INSERT images
CREATE POLICY "Marketplace: Authenticated users can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-images'
);

-- Policy 2: Anyone can SELECT (read) from the bucket (public marketplace)
CREATE POLICY "Marketplace: Public read access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'marketplace-images');

-- Policy 3: Authenticated users can DELETE their own files
CREATE POLICY "Marketplace: Users can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'marketplace-images'
  AND owner = auth.uid()
);

-- Policy 4: Authenticated users can UPDATE their own files
CREATE POLICY "Marketplace: Users can update own images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'marketplace-images'
  AND owner = auth.uid()
);

-- Add comments for documentation
COMMENT ON POLICY "Marketplace: Authenticated users can upload images" ON storage.objects IS 
  'Allows authenticated users to upload product images to marketplace-images bucket';
COMMENT ON POLICY "Marketplace: Public read access" ON storage.objects IS 
  'Allows anyone to view marketplace product images (needed for public listing pages)';
-- Note: Cannot add comment on bucket itself in Postgres, but bucket is documented in code
