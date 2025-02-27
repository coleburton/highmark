#!/bin/bash

# This script demonstrates how to use the strain image upload tool

# Make sure the script is executable
chmod +x scripts/upload-strain-images.ts

# First, let's list all strains to find a strain ID to use
echo "Fetching a strain ID to use for testing..."
STRAIN_ID=$(npx supabase db query "SELECT id FROM strains LIMIT 1" --csv | tail -n 1)

if [ -z "$STRAIN_ID" ]; then
  echo "No strains found in the database. Please add a strain first."
  exit 1
fi

echo "Using strain ID: $STRAIN_ID"

# Create a test directory for images
mkdir -p test_images

# Download a sample image for testing
echo "Downloading a sample image for testing..."
curl -s "https://images.unsplash.com/photo-1603909223429-69bb7101f420?q=80&w=500" -o test_images/sample1.jpg

# Test uploading a single image
echo -e "\nTesting image upload..."
npx ts-node scripts/upload-strain-images.ts upload -s "$STRAIN_ID" -f test_images/sample1.jpg

# List the image for the strain
echo -e "\nListing image for the strain..."
npx ts-node scripts/upload-strain-images.ts list -s "$STRAIN_ID"

# Clean up
echo -e "\nCleaning up test images..."
rm -rf test_images

echo -e "\nTest completed!" 