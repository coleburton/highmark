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

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStorage() {
  console.log('Checking Supabase Storage configuration...\n');

  try {
    // 1. List all buckets
    console.log('1. Listing buckets:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }

    console.log('Found buckets:', buckets.map(b => b.name));

    // 2. Check specifically for the 'assets' bucket
    const assetsBucket = buckets.find(b => b.name === 'assets');
    if (!assetsBucket) {
      console.error('\nError: assets bucket not found!');
      console.log('\nTo fix this:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Storage');
      console.log('3. Click "Create new bucket"');
      console.log('4. Name it "assets"');
      console.log('5. Make sure it is NOT public unless you specifically need it to be');
      return;
    }

    console.log('\nAssets bucket details:', assetsBucket);

    // 3. Try to list contents of the assets bucket
    console.log('\n2. Listing contents of assets bucket:');
    const { data: files, error: filesError } = await supabase.storage
      .from('assets')
      .list('assets/images/strains');

    if (filesError) {
      console.error('Error listing files:', filesError);
      if (filesError.message.includes('does not exist')) {
        console.log('\nTo fix this:');
        console.log('1. Upload a file to create the directory structure');
        console.log('2. Or use the image_trimmer.py script to upload an image');
      }
    } else {
      console.log('Files in assets/images/strains:', files);
    }

    // 4. Check bucket permissions
    console.log('\n3. Checking bucket permissions:');
    const { data: publicUrl } = supabase.storage
      .from('assets')
      .getPublicUrl('assets/images/strains/test.png');

    console.log('Example public URL structure:', publicUrl);

    // 5. Print instructions
    console.log('\nTo ensure images can be displayed:');
    console.log('1. Make sure the assets bucket exists (Status: ' + (assetsBucket ? '✅' : '❌') + ')');
    console.log('2. Verify the correct folder structure exists: assets/images/strains/');
    console.log('3. Check that files are being uploaded to the correct path');
    console.log('4. Ensure the bucket has the appropriate security policies:');
    console.log('   - Go to Storage > Policies in your Supabase dashboard');
    console.log('   - For the assets bucket, you should have these policies:');
    console.log('     * SELECT: authenticated users can view their own files');
    console.log('     * INSERT: authenticated users can upload files');
    console.log('     * UPDATE: authenticated users can update their own files');
    console.log('     * DELETE: authenticated users can delete their own files');

  } catch (error) {
    console.error('Error checking storage:', error);
  }
}

checkStorage(); 