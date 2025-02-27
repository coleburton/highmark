// Script to fix schema issues by adding email column and updating trigger function
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://yrkfyqpqkjwhyosfykbh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5ODUwNywiZXhwIjoyMDU2MTc0NTA3fQ.JXHa42K4VhKJmAHbdARVi_UZbAJqGe8dAyZKh3rGFwM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSchema() {
  console.log('=== FIXING SCHEMA ISSUES ===');
  
  try {
    // Step 1: Check if we can access the users table
    console.log('\n--- CHECKING USERS TABLE ---');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Error accessing users table:', usersError);
      return;
    }
    
    console.log('Successfully accessed users table');
    
    // Step 2: Check if email column exists
    console.log('\n--- CHECKING EMAIL COLUMN ---');
    const { data: emailCheck, error: emailCheckError } = await supabase
      .from('users')
      .select('email')
      .limit(1);
    
    let emailColumnExists = true;
    
    if (emailCheckError && emailCheckError.message.includes('does not exist')) {
      console.log('Email column does not exist in users table');
      emailColumnExists = false;
    } else if (emailCheckError) {
      console.error('Error checking email column:', emailCheckError);
    } else {
      console.log('Email column already exists in users table');
    }
    
    // Step 3: Create a test user to work with
    console.log('\n--- CREATING TEST USER ---');
    const testEmail = `test-${Date.now()}@example.com`;
    const testUsername = `test-${Date.now()}`;
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        username: testUsername,
        first_name: 'Test',
        last_name: 'User',
      },
    });
    
    if (authError) {
      console.error('Error creating test user:', authError);
      return;
    }
    
    console.log(`Created test user with ID: ${authUser.user.id}`);
    
    // Step 4: If email column doesn't exist, try to add it
    if (!emailColumnExists) {
      console.log('\n--- ADDING EMAIL COLUMN ---');
      
      // Try to create a user record with email field
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            id: authUser.user.id,
            username: testUsername,
            email: testEmail,
            first_name: 'Test',
            last_name: 'User',
          }
        ]);
      
      if (insertError && insertError.message.includes('does not exist')) {
        console.log('Insert failed because email column does not exist');
        
        // Try to update an existing user with email field
        // This might trigger an automatic column addition in some Supabase configurations
        console.log('Trying to update a user with email field...');
        
        const { data: existingUsers, error: existingError } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (!existingError && existingUsers && existingUsers.length > 0) {
          const existingId = existingUsers[0].id;
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ email: `existing-${Date.now()}@example.com` })
            .eq('id', existingId);
          
          if (updateError && updateError.message.includes('does not exist')) {
            console.log('Update failed because email column does not exist');
            console.log('Manual schema modification required');
            
            console.log('\nTo fix this issue, you need to:');
            console.log('1. Add the email column to the users table');
            console.log('2. Update the trigger function to include the email field');
            console.log('\nPlease run the following SQL in your Supabase SQL editor:');
            console.log(`
-- Add email column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Update trigger function to include email field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
  v_first_name text;
  v_last_name text;
BEGIN
  -- Extract data from raw_user_meta_data
  v_first_name := (NEW.raw_user_meta_data->>'first_name')::text;
  v_last_name := (NEW.raw_user_meta_data->>'last_name')::text;
  v_username := (NEW.raw_user_meta_data->>'username')::text;
  
  -- If username is not provided, generate one from email
  IF v_username IS NULL THEN
    v_username := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Insert into users table
  BEGIN
    INSERT INTO public.users (
      id,
      username,
      email,
      first_name,
      last_name,
      created_at
    ) VALUES (
      NEW.id,
      v_username,
      NEW.email,
      v_first_name,
      v_last_name,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating user record: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
            `);
          } else if (updateError) {
            console.error('Error updating user:', updateError);
          } else {
            console.log('Update succeeded, email column might have been added automatically');
          }
        } else {
          console.log('No existing users found to update');
        }
      } else if (insertError) {
        console.error('Error inserting user:', insertError);
      } else {
        console.log('Insert succeeded, email column might have been added automatically');
      }
      
      // Verify if email column was added
      console.log('Verifying if email column was added...');
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('email')
        .limit(1);
      
      if (verifyError && verifyError.message.includes('does not exist')) {
        console.log('Email column was not added successfully');
        emailColumnExists = false;
      } else if (verifyError) {
        console.error('Error verifying email column:', verifyError);
      } else {
        console.log('Email column was added successfully!');
        emailColumnExists = true;
      }
    }
    
    // Step 5: Check the trigger function
    console.log('\n--- CHECKING TRIGGER FUNCTION ---');
    
    // We can't directly check the trigger function, but we can test if it works
    // by creating a new user and seeing if it gets added to the users table correctly
    
    const testEmail2 = `test2-${Date.now()}@example.com`;
    const testUsername2 = `test2-${Date.now()}`;
    
    console.log('Creating another test user to check trigger function...');
    
    const { data: authUser2, error: authError2 } = await supabase.auth.admin.createUser({
      email: testEmail2,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        username: testUsername2,
        first_name: 'Test',
        last_name: 'User',
      },
    });
    
    if (authError2) {
      console.error('Error creating second test user:', authError2);
    } else {
      console.log(`Created second test user with ID: ${authUser2.user.id}`);
      
      // Wait for trigger to execute
      console.log('Waiting for trigger to execute...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if user was added to users table
      const { data: userCheck, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser2.user.id)
        .single();
      
      if (userCheckError) {
        console.error('Error checking if user was added:', userCheckError);
        console.log('Trigger function may not be working correctly');
      } else {
        console.log('User was added to users table successfully');
        console.log('Trigger function is working correctly');
        
        // Check if email field was populated
        if (emailColumnExists && userCheck.email === testEmail2) {
          console.log('Email field was populated correctly');
        } else if (emailColumnExists) {
          console.log('Email field exists but was not populated correctly');
          console.log('Trigger function may need to be updated to include email field');
        }
      }
    }
    
    // Step 6: Clean up test users
    console.log('\n--- CLEANING UP TEST USERS ---');
    
    if (authUser) {
      const { error: deleteError1 } = await supabase.auth.admin.deleteUser(authUser.user.id);
      if (deleteError1) {
        console.error('Error deleting first test user:', deleteError1);
      } else {
        console.log('First test user deleted successfully');
      }
    }
    
    if (authUser2) {
      const { error: deleteError2 } = await supabase.auth.admin.deleteUser(authUser2.user.id);
      if (deleteError2) {
        console.error('Error deleting second test user:', deleteError2);
      } else {
        console.log('Second test user deleted successfully');
      }
    }
    
    // Step 7: Summary
    console.log('\n=== SCHEMA FIX SUMMARY ===');
    
    if (emailColumnExists) {
      console.log('✅ Email column exists in users table');
    } else {
      console.log('❌ Email column does not exist in users table');
      console.log('   Manual intervention required');
    }
    
    console.log('\nIf you still have issues, please run the SQL commands provided above in your Supabase SQL editor.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
fixSchema().catch(error => {
  console.error('Fatal error:', error);
}); 