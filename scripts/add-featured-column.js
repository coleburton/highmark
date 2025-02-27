/**
 * Script to add a 'featured' column to the strains table in Supabase
 * 
 * Run this script with:
 * node scripts/add-featured-column.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service key for admin privileges
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service key not found in environment variables');
  console.error('Note: This script requires the SUPABASE_SERVICE_KEY for admin privileges');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addFeaturedColumn() {
  try {
    console.log('Checking if featured column exists in strains table...');
    
    // First, check if the column already exists
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'strains' });
    
    if (columnsError) {
      console.error('Error checking columns:', columnsError);
      console.log('Attempting to add column anyway...');
    } else {
      const featuredColumnExists = columns && columns.some(col => col.column_name === 'featured');
      
      if (featuredColumnExists) {
        console.log('Featured column already exists in strains table');
        return;
      }
    }
    
    console.log('Adding featured column to strains table...');
    
    // Add the featured column with a default value of false
    const { error } = await supabase
      .rpc('add_column_to_table', {
        table_name: 'strains',
        column_name: 'featured',
        column_type: 'boolean',
        default_value: 'false'
      });
    
    if (error) {
      // If the RPC method doesn't exist or fails, try with raw SQL
      console.error('Error using RPC to add column:', error);
      console.log('Note: You may need to add this column manually in the Supabase dashboard');
      console.log('SQL to run: ALTER TABLE strains ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;');
      return;
    }
    
    console.log('Successfully added featured column to strains table!');
    
  } catch (error) {
    console.error('Error adding featured column:', error);
  }
}

// Run the function
addFeaturedColumn()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 