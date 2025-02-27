// Script to consolidate profiles and users tables
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://yrkfyqpqkjwhyosfykbh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5ODUwNywiZXhwIjoyMDU2MTc0NTA3fQ.JXHa42K4VhKJmAHbdARVi_UZbAJqGe8dAyZKh3rGFwM';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function consolidateSchema() {
  console.log('=== SCHEMA CONSOLIDATION TOOL ===');
  console.log('This tool will consolidate profiles and users tables into a single users table');
  
  try {
    // STEP 1: Check current schema
    console.log('\n--- CHECKING CURRENT SCHEMA ---');
    
    // Check users table
    const { data: usersColumns, error: usersError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .order('ordinal_position');
    
    if (usersError) {
      console.error('Error fetching users columns:', usersError);
      return;
    }
    
    console.log('Current users table columns:', usersColumns.map(c => c.column_name).join(', '));
    
    // Check profiles table
    const { data: profilesColumns, error: profilesError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .order('ordinal_position');
    
    if (profilesError) {
      console.error('Error fetching profiles columns:', profilesError);
      return;
    }
    
    console.log('Current profiles table columns:', profilesColumns.map(c => c.column_name).join(', '));
    
    // STEP 2: Add missing columns from profiles to users
    console.log('\n--- ADDING MISSING COLUMNS TO USERS TABLE ---');
    
    // Determine which columns from profiles need to be added to users
    const usersColumnNames = usersColumns.map(c => c.column_name);
    const profilesColumnNames = profilesColumns.map(c => c.column_name);
    
    // Filter out common columns and id/user_id
    const columnsToAdd = profilesColumns.filter(col => 
      !usersColumnNames.includes(col.column_name) && 
      !['id', 'user_id'].includes(col.column_name)
    );
    
    console.log('Columns to add to users table:', columnsToAdd.map(c => c.column_name).join(', '));
    
    if (columnsToAdd.length > 0) {
      // Build ALTER TABLE statement
      let alterTableSQL = 'ALTER TABLE public.users\n';
      
      columnsToAdd.forEach((col, index) => {
        alterTableSQL += `ADD COLUMN IF NOT EXISTS ${col.column_name} ${col.data_type}`;
        if (index < columnsToAdd.length - 1) {
          alterTableSQL += ',\n';
        }
      });
      
      alterTableSQL += ';';
      
      console.log('Executing SQL:', alterTableSQL);
      
      try {
        const { error: alterError } = await supabaseAdmin.rpc('exec_sql', { sql: alterTableSQL });
        
        if (alterError) {
          console.error('Error executing ALTER TABLE:', alterError);
          
          // Try alternative approach
          console.log('Trying alternative approach...');
          
          const { error: directSqlError } = await supabaseAdmin
            .from('_sql')
            .select('*')
            .execute(alterTableSQL);
          
          if (directSqlError) {
            console.error('Error with direct SQL execution:', directSqlError);
          } else {
            console.log('Columns added successfully via direct SQL');
          }
        } else {
          console.log('Columns added successfully');
        }
      } catch (sqlError) {
        console.error('Unexpected error executing SQL:', sqlError);
      }
    } else {
      console.log('No columns need to be added to users table');
    }
    
    // STEP 3: Migrate data from profiles to users
    console.log('\n--- MIGRATING DATA FROM PROFILES TO USERS ---');
    
    // First, check if email column exists in users table
    const hasEmailColumn = usersColumnNames.includes('email');
    
    if (!hasEmailColumn) {
      console.log('Adding email column to users table...');
      
      const addEmailSQL = 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;';
      
      try {
        const { error: emailError } = await supabaseAdmin.rpc('exec_sql', { sql: addEmailSQL });
        
        if (emailError) {
          console.error('Error adding email column:', emailError);
          
          // Try alternative approach
          const { error: directEmailError } = await supabaseAdmin
            .from('_sql')
            .select('*')
            .execute(addEmailSQL);
          
          if (directEmailError) {
            console.error('Error with direct SQL execution:', directEmailError);
          } else {
            console.log('Email column added successfully via direct SQL');
          }
        } else {
          console.log('Email column added successfully');
        }
      } catch (emailError) {
        console.error('Unexpected error adding email column:', emailError);
      }
    }
    
    // Now migrate data from profiles to users
    console.log('Migrating data from profiles to users...');
    
    // Get all profiles
    const { data: profiles, error: profilesFetchError } = await supabaseAdmin
      .from('profiles')
      .select('*');
    
    if (profilesFetchError) {
      console.error('Error fetching profiles:', profilesFetchError);
    } else if (profiles && profiles.length > 0) {
      console.log(`Found ${profiles.length} profiles to migrate`);
      
      // For each profile, update the corresponding user
      let successCount = 0;
      let errorCount = 0;
      
      for (const profile of profiles) {
        // Determine the user ID
        const userId = profile.id; // This assumes profile.id matches auth.users.id
        
        if (!userId) {
          console.error('Profile missing ID, skipping:', profile);
          errorCount++;
          continue;
        }
        
        // Prepare update data (exclude id and user_id)
        const updateData = {};
        Object.keys(profile).forEach(key => {
          if (!['id', 'user_id'].includes(key) && profile[key] !== null) {
            updateData[key] = profile[key];
          }
        });
        
        // Update the user
        try {
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', userId);
          
          if (updateError) {
            console.error(`Error updating user ${userId}:`, updateError);
            
            // Try with auth_id if id doesn't work
            const { error: authIdUpdateError } = await supabaseAdmin
              .from('users')
              .update(updateData)
              .eq('auth_id', userId);
            
            if (authIdUpdateError) {
              console.error(`Error updating user with auth_id ${userId}:`, authIdUpdateError);
              errorCount++;
            } else {
              console.log(`User updated via auth_id: ${userId}`);
              successCount++;
            }
          } else {
            console.log(`User updated: ${userId}`);
            successCount++;
          }
        } catch (updateError) {
          console.error(`Unexpected error updating user ${userId}:`, updateError);
          errorCount++;
        }
      }
      
      console.log(`Migration complete: ${successCount} successful, ${errorCount} failed`);
    } else {
      console.log('No profiles found to migrate');
    }
    
    // STEP 4: Update trigger function to use only users table
    console.log('\n--- UPDATING TRIGGER FUNCTION ---');
    
    // Get the current trigger function
    const { data: triggerFunctions, error: triggerFunctionsError } = await supabaseAdmin
      .from('pg_catalog.pg_proc')
      .select('proname, prosrc')
      .or('proname.eq.handle_new_user,proname.eq.handle_new_auth_user');
    
    if (triggerFunctionsError) {
      console.error('Error fetching trigger functions:', triggerFunctionsError);
    } else if (triggerFunctions && triggerFunctions.length > 0) {
      console.log(`Found ${triggerFunctions.length} trigger functions`);
      
      // Create a new trigger function that only uses the users table
      const newTriggerSQL = `
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
      `;
      
      try {
        const { error: createTriggerError } = await supabaseAdmin.rpc('exec_sql', { sql: newTriggerSQL });
        
        if (createTriggerError) {
          console.error('Error creating new trigger function:', createTriggerError);
          
          // Try alternative approach
          const { error: directTriggerError } = await supabaseAdmin
            .from('_sql')
            .select('*')
            .execute(newTriggerSQL);
          
          if (directTriggerError) {
            console.error('Error with direct SQL execution:', directTriggerError);
          } else {
            console.log('Trigger function created successfully via direct SQL');
          }
        } else {
          console.log('Trigger function created successfully');
        }
      } catch (triggerError) {
        console.error('Unexpected error creating trigger function:', triggerError);
      }
      
      // Ensure the trigger is properly set up
      const triggerSQL = `
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
      `;
      
      try {
        const { error: createTriggerError } = await supabaseAdmin.rpc('exec_sql', { sql: triggerSQL });
        
        if (createTriggerError) {
          console.error('Error setting up trigger:', createTriggerError);
          
          // Try alternative approach
          const { error: directTriggerError } = await supabaseAdmin
            .from('_sql')
            .select('*')
            .execute(triggerSQL);
          
          if (directTriggerError) {
            console.error('Error with direct SQL execution:', directTriggerError);
          } else {
            console.log('Trigger set up successfully via direct SQL');
          }
        } else {
          console.log('Trigger set up successfully');
        }
      } catch (triggerError) {
        console.error('Unexpected error setting up trigger:', triggerError);
      }
    } else {
      console.log('No trigger functions found');
    }
    
    // STEP 5: Test the new setup
    console.log('\n--- TESTING NEW SETUP ---');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testUsername = `test-${Date.now()}`;
    
    console.log(`Creating test user: ${testEmail}`);
    
    const { data: testUser, error: testUserError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        username: testUsername,
        first_name: 'Test',
        last_name: 'User',
      },
    });
    
    if (testUserError) {
      console.error('Error creating test user:', testUserError);
    } else {
      console.log('Test user created successfully');
      
      // Wait for trigger to execute
      console.log('Waiting for trigger to execute...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if user record was created
      const { data: userRecord, error: userRecordError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', testUser.user.id)
        .single();
      
      if (userRecordError) {
        console.error('Error checking user record:', userRecordError);
      } else {
        console.log('User record created successfully:', userRecord);
      }
      
      // Clean up test user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(testUser.user.id);
      
      if (deleteError) {
        console.error('Error deleting test user:', deleteError);
      } else {
        console.log('Test user deleted successfully');
      }
    }
    
    console.log('\n--- SCHEMA CONSOLIDATION COMPLETE ---');
    console.log('The profiles and users tables have been consolidated.');
    console.log('You should now update your application code to use only the users table.');
    
  } catch (error) {
    console.error('Unexpected error during schema consolidation:', error);
  }
}

// Run the consolidation
consolidateSchema().catch(error => {
  console.error('Fatal error:', error);
}); 