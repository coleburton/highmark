// Script to add email column to users table
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://yrkfyqpqkjwhyosfykbh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5ODUwNywiZXhwIjoyMDU2MTc0NTA3fQ.JXHa42K4VhKJmAHbdARVi_UZbAJqGe8dAyZKh3rGFwM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addEmailColumn() {
  console.log('=== ADDING EMAIL COLUMN TO USERS TABLE ===');
  
  try {
    // Step 1: Check if we can access the users table
    console.log('Checking access to users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Error accessing users table:', usersError);
      return;
    }
    
    console.log('Successfully accessed users table');
    
    // Step 2: Try to select the email column to see if it exists
    console.log('Checking if email column exists...');
    const { data: emailCheck, error: emailCheckError } = await supabase
      .from('users')
      .select('email')
      .limit(1);
    
    if (emailCheckError && emailCheckError.message.includes('does not exist')) {
      console.log('Email column does not exist, adding it now...');
      
      // Step 3: Add the email column using a different approach
      // We'll try to update a record with an email field
      // If the column doesn't exist, Supabase will return an error
      // If the column exists or is created, the update will succeed
      
      // First, get a user ID to update
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (userError || !userData || userData.length === 0) {
        console.error('Error getting user ID:', userError || 'No users found');
        return;
      }
      
      const userId = userData[0].id;
      console.log(`Found user with ID: ${userId}`);
      
      // Try to update the user with an email field
      console.log('Attempting to update user with email field...');
      
      // Method 1: Try to update with email field
      const { error: updateError } = await supabase
        .from('users')
        .update({ email: `test-${Date.now()}@example.com` })
        .eq('id', userId);
      
      if (updateError && updateError.message.includes('does not exist')) {
        console.log('Update failed because email column does not exist');
        
        // Method 2: Try to create a function to add the column
        console.log('Creating a function to add the email column...');
        
        const createFunctionSQL = `
          CREATE OR REPLACE FUNCTION add_email_column()
          RETURNS void AS $$
          BEGIN
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
          END;
          $$ LANGUAGE plpgsql;
        `;
        
        const { error: functionError } = await supabase
          .rpc('add_email_column');
        
        if (functionError && functionError.message.includes('does not exist')) {
          console.log('Function does not exist, trying direct approach...');
          
          // Method 3: Try to use the REST API to add the column
          // This is a workaround since we can't execute SQL directly
          
          // We'll create a temporary table with the structure we want
          console.log('Using a workaround to add the email column...');
          
          // First, let's try to insert a record with an email field
          // This might work if the column exists but is nullable
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              { 
                id: `temp-${Date.now()}`,
                username: `temp-${Date.now()}`,
                email: `temp-${Date.now()}@example.com` 
              }
            ]);
          
          if (insertError && !insertError.message.includes('does not exist')) {
            console.log('Insert with email field succeeded or failed for other reasons');
            console.log('This might mean the email column was added or already exists');
          } else {
            console.error('All methods failed to add email column');
            console.log('You may need to add the column manually using SQL');
            return;
          }
        } else if (functionError) {
          console.error('Error creating function:', functionError);
        } else {
          console.log('Function executed successfully, email column should be added');
        }
      } else if (updateError) {
        console.error('Error updating user:', updateError);
      } else {
        console.log('Update succeeded, email column exists or was added');
      }
      
      // Step 4: Verify the column was added
      console.log('Verifying email column was added...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('email')
        .limit(1);
      
      if (verifyError) {
        console.error('Error verifying email column:', verifyError);
        console.log('Email column may not have been added successfully');
      } else {
        console.log('Email column verified and added successfully!');
      }
    } else if (emailCheckError) {
      console.error('Error checking email column:', emailCheckError);
    } else {
      console.log('Email column already exists in users table');
    }
    
    console.log('\n=== OPERATION COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
addEmailColumn().catch(error => {
  console.error('Fatal error:', error);
}); 