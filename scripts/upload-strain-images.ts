#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { supabase } from '../src/lib/supabase';
import { decode } from 'base64-arraybuffer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const program = new Command();

// Configure the CLI program
program
  .name('upload-strain-images')
  .description('Upload strain images to Supabase storage and link them to strains')
  .version('1.0.0');

// Command for uploading a single image
program
  .command('upload')
  .description('Upload a single image for a strain')
  .requiredOption('-s, --strain-id <id>', 'ID of the strain to link the image to')
  .requiredOption('-f, --file <path>', 'Path to the image file')
  .action(async (options) => {
    try {
      const { strainId, file } = options;
      
      // Check if file exists
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }
      
      // Check if strain exists
      const { data: strain, error: strainError } = await supabase
        .from('strains')
        .select('id, name')
        .eq('id', strainId)
        .single();
        
      if (strainError) {
        console.error(`Error: Strain not found with ID: ${strainId}`);
        process.exit(1);
      }
      
      console.log(`Uploading image for strain: ${strain.name} (${strainId})`);
      
      // Upload the image
      const imageUrl = await uploadImage(file, strainId);
      console.log(`Image uploaded successfully: ${imageUrl}`);
      
      // Update the strain with the new image URL
      const { error: updateError } = await supabase
        .from('strains')
        .update({
          image_url: imageUrl
        })
        .eq('id', strainId);
        
      if (updateError) {
        console.error('Error updating strain:', updateError);
        process.exit(1);
      }
      
      console.log('Strain updated successfully with new image');
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

// Command for listing the image for a strain
program
  .command('list')
  .description('Show the image for a strain')
  .requiredOption('-s, --strain-id <id>', 'ID of the strain')
  .action(async (options) => {
    try {
      const { strainId } = options;
      
      // Check if strain exists
      const { data: strain, error: strainError } = await supabase
        .from('strains')
        .select('id, name, image_url')
        .eq('id', strainId)
        .single();
        
      if (strainError) {
        console.error(`Error: Strain not found with ID: ${strainId}`);
        process.exit(1);
      }
      
      console.log(`Image for strain: ${strain.name} (${strainId})`);
      
      if (!strain.image_url) {
        console.log('No image found for this strain');
      } else {
        console.log(`Image URL: ${strain.image_url}`);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

// Helper function to upload an image to Supabase storage
async function uploadImage(filePath: string, strainId: string): Promise<string> {
  try {
    // Create a unique filename using the strain ID and timestamp
    const originalFilename = path.basename(filePath);
    const fileExt = path.extname(originalFilename);
    const filename = `${strainId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}${fileExt}`;
    
    // Read the file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    // Convert buffer to base64 then to ArrayBuffer for Supabase
    const fileBase64 = fileBuffer.toString('base64');
    const arrayBuffer = decode(fileBase64);
    
    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(`images/strains/${filename}`, arrayBuffer, {
        contentType: `image/${fileExt.substring(1)}`,
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
}

program.parse(process.argv); 