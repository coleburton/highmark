/**
 * Utility functions for handling strain images from Supabase storage
 */

import { ImageSourcePropType } from 'react-native';
import { Strain } from '../types';
import { supabase } from '../lib/supabase';

// Default placeholder image for strains
export const DEFAULT_STRAIN_IMAGE: ImageSourcePropType = require('../../assets/images/placeholder.png');

/**
 * Get the public URL for a file in Supabase storage
 * @param filename The filename in the assets bucket
 * @param transform Optional image transformation options
 * @returns The public URL for the file
 */
export const getStorageUrl = (
  filename: string,
  transform?: { width?: number; height?: number; quality?: number }
): string => {
  try {
    // Clean the filename to ensure it doesn't have any URL components
    const cleanFilename = filename.replace(/^https?:\/\/.*\//, '');
    
    // Get the public URL using the Supabase Storage API
    const { data } = supabase.storage
      .from('assets')
      .getPublicUrl(cleanFilename, transform ? { transform } : undefined);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting storage URL:', error);
    return '';
  }
};

/**
 * Fix a Supabase URL to ensure it has the correct format
 * @param url The URL to fix
 * @returns The fixed URL
 */
export const fixSupabaseUrl = (url: string): string => {
  try {
    if (!url) return '';
    
    // If it's already a valid URL, return it
    if (url.startsWith('http') && !url.includes('undefined')) {
      return url;
    }
    
    // If it's a relative path in the storage bucket
    if (!url.startsWith('http')) {
      return getStorageUrl(url);
    }
    
    return url;
  } catch (error) {
    console.error('Error fixing Supabase URL:', error);
    return '';
  }
};

/**
 * Get the image for a strain synchronously (non-async version)
 * @param strain The strain object or ID
 * @returns The image source for the strain
 */
export const getStrainImageSync = (strain: Strain | string | null): ImageSourcePropType => {
  try {
    // For specific strain IDs, return local images
    if (typeof strain === 'string') {
      if (strain === 's1') {
        return require('../../assets/images/strains/s1/blue_dream_1.jpg');
      } else if (strain === 's2') {
        return require('../../assets/images/strains/s2/og_kush_1.jpg');
      } else if (strain === 's3') {
        return require('../../assets/images/strains/s3/sour_diesel_1.jpg');
      }
      
      // For other IDs, return the default image
      return DEFAULT_STRAIN_IMAGE;
    }
    
    // If it's a strain object with an image_url
    if (strain && typeof strain === 'object' && 'image_url' in strain) {
      // For specific strain IDs in the object
      if (strain.id === 's1') {
        return require('../../assets/images/strains/s1/blue_dream_1.jpg');
      } else if (strain.id === 's2') {
        return require('../../assets/images/strains/s2/og_kush_1.jpg');
      } else if (strain.id === 's3') {
        return require('../../assets/images/strains/s3/sour_diesel_1.jpg');
      }
      
      // For other strains, return the default image
      return DEFAULT_STRAIN_IMAGE;
    }
    
    return DEFAULT_STRAIN_IMAGE;
  } catch (error) {
    console.error('Error in getStrainImageSync:', error);
    return DEFAULT_STRAIN_IMAGE;
  }
};

/**
 * Check if a URL is a valid image URL
 * @param url The URL to check
 * @returns Whether the URL is valid
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Basic URL validation
  try {
    new URL(url);
    return url.length > 0 && !url.includes('undefined');
  } catch (e) {
    return false;
  }
};

/**
 * Get the public URL for a file in Supabase storage
 * @param bucket The bucket name
 * @param path The file path
 * @returns The public URL for the file
 */
export const getSupabasePublicUrl = (bucket: string, path: string): string => {
  try {
    if (!bucket || !path) return '';
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  } catch (error) {
    console.log(`Error getting public URL for ${bucket}/${path}:`, error);
    return '';
  }
};

/**
 * Process a strain image URL from Supabase
 * @param imageUrl The image URL or filename
 * @returns The processed image source for React Native
 */
export const processStrainImage = (imageUrl: string | null | undefined): ImageSourcePropType => {
  if (!imageUrl) {
    return DEFAULT_STRAIN_IMAGE;
  }
  
  try {
    // If it's already a full URL
    if (imageUrl.startsWith('http')) {
      return { uri: imageUrl };
    }
    
    // Otherwise, treat it as a filename in the assets bucket
    const publicUrl = getStorageUrl(imageUrl);
    
    if (publicUrl) {
      return { uri: publicUrl };
    }
    
    return DEFAULT_STRAIN_IMAGE;
  } catch (error) {
    console.error('Error processing strain image:', error);
    return DEFAULT_STRAIN_IMAGE;
  }
};

/**
 * Get the image for a strain based on its image_url
 * @param strain The strain object or ID
 * @returns The image source for the strain
 */
export const getStrainImage = async (strain: Strain | string | null): Promise<ImageSourcePropType> => {
  try {
    // If it's a string, assume it's a strain ID and fetch from Supabase
    if (typeof strain === 'string') {
      const { data, error } = await supabase
        .from('strains')
        .select('image_url')
        .eq('id', strain)
        .single();
        
      if (error || !data?.image_url) {
        return DEFAULT_STRAIN_IMAGE;
      }
      
      return processStrainImage(data.image_url);
    }
    
    // If it's a strain object with an image_url
    if (strain && typeof strain === 'object' && 'image_url' in strain) {
      return processStrainImage(strain.image_url);
    }
    
    return DEFAULT_STRAIN_IMAGE;
  } catch (error) {
    console.error('Error in getStrainImage:', error);
    return DEFAULT_STRAIN_IMAGE;
  }
};

/**
 * Get all images for a strain
 * @param strain The strain object or ID
 * @returns An array of image sources for the strain
 */
export const getAllStrainImages = async (strain: Strain | string | null): Promise<ImageSourcePropType[]> => {
  try {
    // If it's a string ID, fetch the strain data first
    if (typeof strain === 'string') {
      const { data, error } = await supabase
        .from('strains')
        .select('image_url, images')
        .eq('id', strain)
        .single();
        
      if (error || !data) {
        return [DEFAULT_STRAIN_IMAGE];
      }
      
      strain = data as unknown as Strain;
    }
    
    if (!strain) {
      return [DEFAULT_STRAIN_IMAGE];
    }
    
    const images: ImageSourcePropType[] = [];
    
    // Add the main image if it exists
    if ('image_url' in strain && strain.image_url) {
      images.push(processStrainImage(strain.image_url));
    }
    
    // Add additional images if they exist
    if ('images' in strain && Array.isArray(strain.images)) {
      const additionalImages = strain.images
        .filter(Boolean)
        .map(img => processStrainImage(img));
      
      images.push(...additionalImages);
    }
    
    // Return default image if no images were found
    return images.length > 0 ? images : [DEFAULT_STRAIN_IMAGE];
  } catch (error) {
    console.error('Error in getAllStrainImages:', error);
    return [DEFAULT_STRAIN_IMAGE];
  }
};

/**
 * Get the featured strains with their images
 * @returns An array of featured strains with processed image sources
 */
export const getFeaturedStrainImages = async (): Promise<Strain[]> => {
  try {
    const { data, error } = await supabase
      .from('strains')
      .select('*')
      .eq('is_featured', true)
      .eq('approved', true);
      
    if (error || !data) {
      console.error('Error fetching featured strains:', error);
      return [];
    }
    
    // Process each strain to ensure its image_url is ready for React Native
    return Promise.all(data.map(async (strain) => {
      const imageSource = await getStrainImage(strain);
      
      // Create a new strain object with the processed image
      return {
        ...strain,
        // Store the processed image source in a new property for direct use in components
        processedImage: imageSource
      } as Strain & { processedImage: ImageSourcePropType };
    }));
  } catch (error) {
    console.error('Error in getFeaturedStrainImages:', error);
    return [];
  }
};

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

/**
 * Debug function to list files in the Supabase storage bucket
 * This can help identify what files are actually available
 */
export const listStorageFiles = async (prefix: string = ''): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage
      .from('assets')
      .list(prefix);
    
    if (error || !data) {
      console.error('Error listing files:', error);
      return [];
    }
    
    return data.map(item => item.name);
  } catch (error) {
    console.error('Error in listStorageFiles:', error);
    return [];
  }
};

/**
 * Check if a strain has multiple images
 * @param strain The strain object or ID
 * @returns Whether the strain has multiple images
 */
export const hasMultipleImages = async (strain: Strain | string | null): Promise<boolean> => {
  try {
    const images = await getAllStrainImages(strain);
    return images.length > 1;
  } catch (error) {
    console.error('Error in hasMultipleImages:', error);
    return false;
  }
}; 