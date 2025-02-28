import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

// Create Supabase client with anon key to test public access
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPublicAccess() {
  console.log('Testing public access to strain images...\n');

  try {
    // Try to list the contents of the strains directory
    const { data: files, error: filesError } = await supabase.storage
      .from('assets')
      .list('assets/images/strains');

    if (filesError) {
      console.error('❌ Error listing files:', filesError);
      console.log('\nThis suggests the bucket policies need to be updated.');
      return;
    }

    console.log('✅ Successfully listed files:', files.map(f => f.name));

    // Try to get a public URL for the first image
    if (files && files.length > 0) {
      const firstImage = files[0].name;
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(`assets/images/strains/${firstImage}`);

      console.log('\nTesting public URL access for:', firstImage);
      console.log('Public URL:', publicUrl);
      
      // Try to fetch the image to verify access
      try {
        const response = await fetch(publicUrl);
        if (response.ok) {
          console.log('✅ Successfully accessed image through public URL');
        } else {
          console.log('❌ Could not access image through public URL:', response.status);
        }
      } catch (error) {
        console.error('❌ Error accessing public URL:', error);
      }
    }

  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testPublicAccess(); 