import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Uploads an image to Supabase storage and returns the public URL
 * @param uri Local URI of the image to upload
 * @param strainId ID of the strain (used for naming)
 * @returns Public URL of the uploaded image
 */
export const uploadStrainImage = async (uri: string, strainId: string): Promise<string> => {
  try {
    // Create a unique filename using the strain ID and timestamp
    const filename = `${strainId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
    const filePath = `strains/${filename}`;
    
    // Read the file as base64
    const fileBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to ArrayBuffer
    const fileBuffer = decode(fileBase64);
    
    // Upload the file to Supabase storage in the assets/images/strains/ bucket
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(`images/strains/${filename}`, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading to Supabase:', error);
      throw error;
    }
    
    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(`images/strains/${filename}`);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Uploads multiple strain images to Supabase storage
 * @param uris Array of local image URIs to upload
 * @param strainId ID of the strain
 * @returns Array of public URLs for the uploaded images
 */
export const uploadStrainImages = async (uris: string[], strainId: string): Promise<string[]> => {
  try {
    const uploadPromises = uris.map(uri => uploadStrainImage(uri, strainId));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Deletes a strain image from Supabase storage
 * @param url The public URL of the image to delete
 * @returns Boolean indicating success
 */
export const deleteStrainImage = async (url: string): Promise<boolean> => {
  try {
    // Extract the path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    const filePath = `images/strains/${filename}`;
    
    const { error } = await supabase.storage
      .from('assets')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting from Supabase:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}; 