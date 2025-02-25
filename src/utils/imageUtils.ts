/**
 * Utility functions for handling strain images
 */

// Map of strain IDs to their image filenames (without extension for flexibility)
export const strainImages: Record<string, string[]> = {
  's1': ['blue_dream_1'],
  's2': ['og_kush_1'],
  's3': ['sour_diesel_1'],
  // Add more strains as needed
};

// Instead of trying to load an empty file, we'll use a hardcoded default
// This is a simple object that React Native's Image component can use as a fallback
const DEFAULT_STRAIN_IMAGE = { uri: 'https://placehold.co/400x400/10B981/FFFFFF/png?text=Strain' };

// Cache for loaded images to avoid repeated requires
const imageCache: Record<string, any> = {};

/**
 * Get the image for a strain
 * @param strainId The ID of the strain
 * @param index Optional index of the image to retrieve (defaults to 0)
 * @returns The image module for the strain
 */
export function getStrainImage(strainId: string, index: number = 0): any {
  const cacheKey = `${strainId}_${index}`;
  
  // Return from cache if available
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }
  
  try {
    // If strain doesn't exist or no images, return default
    if (!strainImages[strainId] || strainImages[strainId].length === 0) {
      return DEFAULT_STRAIN_IMAGE;
    }
    
    // If index is out of bounds, use the first image
    const imageIndex = index >= strainImages[strainId].length ? 0 : index;
    const imageName = strainImages[strainId][imageIndex];
    
    // Dynamic requires aren't supported in React Native, so we need to handle each case
    let image;
    switch (`${strainId}/${imageName}`) {
      case 's1/blue_dream_1':
        image = require('../../assets/images/strains/s1/blue_dream_1.jpg');
        break;
      case 's2/og_kush_1':
        image = require('../../assets/images/strains/s2/og_kush_1.jpg');
        break;
      case 's3/sour_diesel_1':
        image = require('../../assets/images/strains/s3/sour_diesel_1.jpg');
        break;
      default:
        // If we can't find the specific image, use the default
        image = DEFAULT_STRAIN_IMAGE;
    }
    
    // Cache the result
    imageCache[cacheKey] = image;
    return image;
  } catch (error) {
    console.error(`Error loading image for strain ${strainId}:`, error);
    return DEFAULT_STRAIN_IMAGE;
  }
}

/**
 * Get all images for a strain
 * @param strainId The ID of the strain
 * @returns Array of image modules for the strain
 */
export function getAllStrainImages(strainId: string): any[] {
  if (!strainImages[strainId] || strainImages[strainId].length === 0) {
    return [DEFAULT_STRAIN_IMAGE];
  }
  
  return strainImages[strainId].map((_, index) => getStrainImage(strainId, index));
}

/**
 * Check if a strain has multiple images
 * @param strainId The ID of the strain
 * @returns True if the strain has more than one image
 */
export function hasMultipleImages(strainId: string): boolean {
  return strainImages[strainId]?.length > 1;
}

// Legacy functions that return string paths (keeping for backward compatibility)
// These won't work for local images in React Native but are kept for reference
export function getStrainImagePath(strainId: string, index: number = 0): string {
  console.warn('getStrainImagePath is deprecated. Use getStrainImage instead for React Native local images.');
  if (!strainImages[strainId] || strainImages[strainId].length === 0) {
    return `assets/images/strains/default_strain.jpg`;
  }
  
  const imageIndex = index >= strainImages[strainId].length ? 0 : index;
  return `assets/images/strains/${strainId}/${strainImages[strainId][imageIndex]}.jpg`;
}

export function getAllStrainImagePaths(strainId: string): string[] {
  console.warn('getAllStrainImagePaths is deprecated. Use getAllStrainImages instead for React Native local images.');
  if (!strainImages[strainId] || strainImages[strainId].length === 0) {
    return [`assets/images/strains/default_strain.jpg`];
  }
  
  return strainImages[strainId].map((filename) => 
    `assets/images/strains/${strainId}/${filename}.jpg`
  );
} 