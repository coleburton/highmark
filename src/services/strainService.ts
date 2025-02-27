import { supabase } from '../lib/supabase';
import { Strain } from '../types';
import { uploadStrainImage } from './storageService';

/**
 * Submits a new strain with an image to the database
 * @param strainData The strain data to submit
 * @param imageUri Local image URI to upload
 * @returns The created strain
 */
export const submitStrainWithImage = async (
  strainData: Omit<Strain, 'id' | 'created_at' | 'image_url' | 'approved'>, 
  imageUri: string | null = null
): Promise<Strain> => {
  try {
    // First create the strain without image
    const { data: strain, error } = await supabase
      .from('strains')
      .insert({
        name: strainData.name,
        type: strainData.type,
        thc_percentage: strainData.THC_percentage,
        cbd_percentage: strainData.CBD_percentage,
        effects: strainData.effects,
        flavors: strainData.flavors,
        description: strainData.description,
        submitted_by: strainData.submitted_by,
        approved: false, // New strains typically need approval
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // If there is an image to upload
    if (imageUri) {
      // Upload the image and get the URL
      const imageUrl = await uploadStrainImage(imageUri, strain.id);
      
      // Update the strain with the image URL
      const { data: updatedStrain, error: updateError } = await supabase
        .from('strains')
        .update({
          image_url: imageUrl,
        })
        .eq('id', strain.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return updatedStrain;
    }
    
    return strain;
  } catch (error) {
    console.error('Error submitting strain:', error);
    throw error;
  }
};

/**
 * Updates an existing strain with a new image
 * @param strainId The ID of the strain to update
 * @param strainData The updated strain data
 * @param imageUri Local image URI to upload
 * @returns The updated strain
 */
export const updateStrainWithImage = async (
  strainId: string,
  strainData: Partial<Omit<Strain, 'id' | 'created_at' | 'image_url' | 'approved'>>,
  imageUri: string | null = null
): Promise<Strain> => {
  try {
    // First update the strain data without image
    const updateData: any = {};
    
    if (strainData.name) updateData.name = strainData.name;
    if (strainData.type) updateData.type = strainData.type;
    if (strainData.THC_percentage !== undefined) updateData.thc_percentage = strainData.THC_percentage;
    if (strainData.CBD_percentage !== undefined) updateData.cbd_percentage = strainData.CBD_percentage;
    if (strainData.effects) updateData.effects = strainData.effects;
    if (strainData.flavors) updateData.flavors = strainData.flavors;
    if (strainData.description) updateData.description = strainData.description;
    
    // If there is a new image to upload
    if (imageUri) {
      // Upload the new image and get the URL
      const imageUrl = await uploadStrainImage(imageUri, strainId);
      
      // Update the image URL
      updateData.image_url = imageUrl;
    }
    
    // Update the strain with all changes
    const { data: updatedStrain, error } = await supabase
      .from('strains')
      .update(updateData)
      .eq('id', strainId)
      .select()
      .single();
    
    if (error) throw error;
    
    return updatedStrain;
  } catch (error) {
    console.error('Error updating strain:', error);
    throw error;
  }
};

/**
 * Sets a specific image as the primary image for a strain
 * @param strainId The ID of the strain
 * @param imageUrl The URL of the image to set as primary
 * @returns The updated strain
 */
export const setStrainPrimaryImage = async (
  strainId: string,
  imageUrl: string
): Promise<Strain> => {
  try {
    const { data: strain, error } = await supabase
      .from('strains')
      .update({
        image_url: imageUrl
      })
      .eq('id', strainId)
      .select()
      .single();
    
    if (error) throw error;
    
    return strain;
  } catch (error) {
    console.error('Error setting primary image:', error);
    throw error;
  }
}; 