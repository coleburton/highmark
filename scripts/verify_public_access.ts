import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_KEY) must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const testPublicAccess = async () => {
  try {
    // First, get all images from the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('assets')
      .list('assets/images/strains');

    if (listError) {
      console.error('Error listing files:', listError);
      return;
    }

    console.log(`Found ${files.length} images to test\n`);

    // Test each image
    for (const file of files) {
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(`assets/images/strains/${file.name}`);
      
      console.log(`Testing: ${file.name}`);
      console.log(`URL: ${publicUrl}`);
      
      try {
        const response = await fetch(publicUrl);
        if (response.ok) {
          console.log('✅ Success!');
          console.log('Content-Type:', response.headers.get('content-type'));
          console.log('Content-Length:', response.headers.get('content-length'));
        } else {
          console.log('❌ Error');
          console.log('Status:', response.status);
          console.log('Status Text:', response.statusText);
        }
      } catch (error) {
        console.error('❌ Error accessing image:', error);
      }
      
      console.log('-------------------\n');
    }

  } catch (error) {
    console.error('Error during testing:', error);
  }
};

testPublicAccess(); 