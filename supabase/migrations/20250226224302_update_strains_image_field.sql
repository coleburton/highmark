-- Migration to update the strains table
-- Replace the 'images' array field with a single 'image_url' field

-- First, make sure all strains have an image_url if they have images
UPDATE strains
SET image_url = images[1]
WHERE image_url IS NULL AND array_length(images, 1) > 0;

-- Now, drop the images column
ALTER TABLE strains DROP COLUMN images;

-- Make sure image_url is properly documented
COMMENT ON COLUMN strains.image_url IS 'URL to the strain image in Supabase storage at assets/images/strains/'; 