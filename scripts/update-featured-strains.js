/**
 * Script to update strains in Supabase to set the 'featured' flag
 * 
 * Run this script with:
 * node scripts/update-featured-strains.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateFeaturedStrains() {
  try {
    console.log('Fetching strains from Supabase...');
    
    // First, get all approved strains
    const { data: strains, error } = await supabase
      .from('strains')
      .select('id, name')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    if (!strains || strains.length === 0) {
      console.log('No approved strains found in the database');
      return;
    }
    
    console.log(`Found ${strains.length} approved strains`);
    
    // Select a few strains to mark as featured (up to 5 or all if less than 5)
    const strainsToFeature = strains.slice(0, Math.min(5, strains.length));
    
    console.log('Marking the following strains as featured:');
    strainsToFeature.forEach(strain => {
      console.log(`- ${strain.name} (${strain.id})`);
    });
    
    // Update the strains to set featured = true
    const { error: updateError } = await supabase
      .from('strains')
      .update({ featured: true })
      .in('id', strainsToFeature.map(s => s.id));
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('Successfully updated strains to be featured!');
    
    // Verify the update
    const { data: featuredStrains, error: verifyError } = await supabase
      .from('strains')
      .select('id, name')
      .eq('featured', true);
    
    if (verifyError) {
      throw verifyError;
    }
    
    console.log(`Verified ${featuredStrains.length} featured strains in the database:`);
    featuredStrains.forEach(strain => {
      console.log(`- ${strain.name} (${strain.id})`);
    });
    
  } catch (error) {
    console.error('Error updating featured strains:', error);
  }
}

// Run the function
updateFeaturedStrains()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 