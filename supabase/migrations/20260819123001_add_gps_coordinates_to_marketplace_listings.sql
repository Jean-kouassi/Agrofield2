-- Migration: Add GPS coordinates to marketplace_listings for delivery drivers
-- Date: 2026-08-19 12:30
-- Purpose: Enable precise location tracking like WhatsApp for easier deliveries

-- Add latitude column (required)
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

-- Add longitude column (required)
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add location_address column (optional, human-readable)
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create spatial index for location-based queries (future feature)
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_location 
ON public.marketplace_listings(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.marketplace_listings.latitude IS 'Latitude GPS pour la localisation précise (comme WhatsApp)';
COMMENT ON COLUMN public.marketplace_listings.longitude IS 'Longitude GPS pour la localisation précise (comme WhatsApp)';
COMMENT ON COLUMN public.marketplace_listings.location_address IS 'Adresse textuelle optionnelle issue du reverse geocoding';

-- Make GPS coordinates required via CHECK constraint (only for new listings with status != 'draft')
-- Note: We use a trigger instead of CHECK for better flexibility
CREATE OR REPLACE FUNCTION check_gps_coordinates_required()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip check for drafts
  IF NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;
  
  -- For published listings, GPS is required
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    RAISE EXCEPTION 'GPS coordinates are required for published listings. Please enable location services.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_gps_coordinates ON public.marketplace_listings;

-- Create trigger
CREATE TRIGGER enforce_gps_coordinates
  BEFORE INSERT OR UPDATE ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION check_gps_coordinates_required();
