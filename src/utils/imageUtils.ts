/**
 * Utility functions for handling strain images
 */

import { ImageSourcePropType } from 'react-native';
import { Strain } from '../types';

// Define the mapping of strain IDs to their image filenames
const strainImages: Record<string, string> = {
  'strain-1': 'blue_dream_1.jpg',
  'strain-2': 'og_kush_1.jpg',
  'strain-3': 'sour_diesel_1.jpg',
  'strain-4': 'northern_lights_1.jpg',
  'strain-5': 'jack_herer_1.jpg',
  'strain-6': 'pineapple_express_1.jpg',
  'strain-7': 'gsc_1.jpg',
};

// Default image to use if a strain image is not found
const DEFAULT_STRAIN_IMAGE = { uri: 'https://placehold.co/400x400/10B981/FFFFFF/png?text=Strain' };

// Cache for loaded images to avoid repeated requires
const imageCache: Record<string, any> = {};

/**
 * Get the image for a strain based on its image_url
 * @param strain The strain object
 * @returns The image source for the strain
 */
export const getStrainImage = (strain: Strain | string | null): ImageSourcePropType => {
  // If it's a string, assume it's a strain ID and use the legacy function
  if (typeof strain === 'string') {
    return getStrainImageById(strain);
  }
  
  // If it's a strain object, use the image_url
  if (strain && 'image_url' in strain && strain.image_url) {
    return { uri: strain.image_url };
  }
  
  return DEFAULT_STRAIN_IMAGE;
};

/**
 * Get the image for a strain based on its ID (legacy function)
 * @param strainId The ID of the strain
 * @returns The image source for the strain
 */
export const getStrainImageById = (strainId: string): ImageSourcePropType => {
  try {
    // Map of strain IDs to their respective image sources
    const imageMap: Record<string, ImageSourcePropType> = {
      'strain-1': require('../../assets/images/strains/s1/blue_dream_1.jpg'),
      'strain-2': require('../../assets/images/strains/s2/og_kush_1.jpg'),
      'strain-3': require('../../assets/images/strains/s3/sour_diesel_1.jpg'),
      'strain-4': require('../../assets/images/placeholder.png'),
      'strain-5': require('../../assets/images/placeholder.png'),
      'strain-6': require('../../assets/images/placeholder.png'),
      'strain-7': require('../../assets/images/placeholder.png'),
    };

    // Try to return the image source for the strain ID, or the local placeholder if not found
    return imageMap[strainId] || require('../../assets/images/placeholder.png');
  } catch (error) {
    // If there's any error (like the placeholder not being found), use the URL fallback
    console.warn('Error loading strain image:', error);
    return DEFAULT_STRAIN_IMAGE;
  }
};

/**
 * Get all images for a strain (legacy function for backward compatibility)
 * @param strain The strain object or ID
 * @returns Array with a single image object for the strain
 */
export function getAllStrainImages(strain: Strain | string | null): ImageSourcePropType[] {
  return [getStrainImage(strain)];
}

/**
 * Check if a strain has multiple images (legacy function for backward compatibility)
 * @returns Always false since we only have one image per strain
 */
export function hasMultipleImages(): boolean {
  return false;
}

/**
 * Get the image URL for a strain
 * @param strainId The ID of the strain
 * @returns The image URL for the strain
 */
export function getStrainImageUrl(strainId: string): string {
  return strainImages[strainId] || 'https://placehold.co/400x400/10B981/FFFFFF/png?text=Strain';
}

// Legacy functions that return string paths (keeping for backward compatibility)
// These won't work for local images in React Native but are kept for reference
export function getStrainImagePath(strainId: string, index: number = 0): string {
  console.warn('getStrainImagePath is deprecated. Use getStrainImage instead for React Native local images.');
  if (!strainImages[strainId]) {
    return `assets/images/strains/default_strain.jpg`;
  }
  
  return `assets/images/strains/${strainId}/${strainImages[strainId]}`;
}

export function getAllStrainImagePaths(strainId: string): string[] {
  console.warn('getAllStrainImagePaths is deprecated. Use getAllStrainImages instead for React Native local images.');
  if (!strainImages[strainId]) {
    return [`assets/images/strains/default_strain.jpg`];
  }
  
  return [`assets/images/strains/${strainId}/${strainImages[strainId]}`];
}

/**
 * Get the avatar image for a user based on their username
 * @param username The username of the user
 * @returns The avatar image source for the user
 */
export const getUserAvatar = (username: string): ImageSourcePropType => {
  try {
    // Try to use the local avatar placeholder
    return require('../../assets/images/avatar-placeholder.png');
  } catch (error) {
    // If there's any error, fall back to the URL-based avatar
    console.warn('Error loading avatar image:', error);
    return { uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username) + '&background=10B981&color=fff' };
  }
}; 