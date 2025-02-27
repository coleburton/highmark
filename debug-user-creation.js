// Debug script for user creation process
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://yrkfyqpqkjwhyosfykbh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTg1MDcsImV4cCI6MjA1NjE3NDUwN30.83gJiidaKbTrWD6k4prhQEO8fiPPxwbSu9I1TQVSoCA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5ODUwNywiZXhwIjoyMDU2MTc0NTA3fQ.JXHa42K4VhKJmAHbdARVi_UZbAJqGe8dAyZKh3rGFwM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Generate a unique email for testing
const testEmail = `debug-${Date.now()}@example.com`;
const testPassword = 'password123';
const testUsername = `debug-${Date.now()}`;

async function debugUserCreation() {
  console.log('=== USER CREATION DEBUGGING TOOL ===');
  console.log(`Test credentials: ${testEmail} / ${testUsername}`);
  
  try {
    // STEP 1: Check for existing trigger functions
    console.log('\n--- CHECKING EXISTING TRIGGER FUNCTIONS ---');
    const { data: triggerFunctions, error: triggerFunctionsError } = await supabaseAdmin
      .from('pg_catalog.pg_proc')
      .select('proname, pronamespace')
      .or('proname.ilike.%user%,proname.ilike.%auth%');
    
    if (triggerFunctionsError) {
      console.error('Error fetching trigger functions:', triggerFunctionsError);
    } else {
      console.log('Trigger functions:', triggerFunctions);
    }
    
    // STEP 2: Check for existing triggers on auth.users
    console.log('\n--- CHECKING EXISTING TRIGGERS ON AUTH.USERS ---');
    const { data: triggers, error: triggersError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('event_object_schema', 'auth')
      .eq('event_object_table', 'users');
    
    if (triggersError) {
      console.error('Error fetching triggers:', triggersError);
    } else {
      console.log('Triggers on auth.users:', triggers);
    }
    
    // STEP 3: Check users table structure
    console.log('\n--- CHECKING USERS TABLE STRUCTURE ---');
    const { data: usersColumns, error: usersColumnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .order('ordinal_position');
    
    if (usersColumnsError) {
      console.error('Error fetching users columns:', usersColumnsError);
    } else {
      console.log('Users table columns:', usersColumns);
      
      // Check if email column exists
      const hasEmailColumn = usersColumns.some(col => col.column_name === 'email');
      console.log('Email column exists:', hasEmailColumn);
      
      // Check if auth_id column exists
      const hasAuthIdColumn = usersColumns.some(col => col.column_name === 'auth_id');
      console.log('Auth_id column exists:', hasAuthIdColumn);
      
      // Check primary key
      const { data: primaryKey, error: primaryKeyError } = await supabaseAdmin
        .from('information_schema.table_constraints')
        .select('constraint_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'users')
        .eq('constraint_type', 'PRIMARY KEY');
      
      if (primaryKeyError) {
        console.error('Error fetching primary key:', primaryKeyError);
      } else {
        console.log('Primary key constraint:', primaryKey);
      }
    }
    
    // STEP 4: Create a test user with admin API
    console.log('\n--- CREATING TEST USER WITH ADMIN API ---');
    const { data: adminUserData, error: adminUserError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        username: testUsername,
        first_name: 'Debug',
        last_name: 'User',
      },
    });
    
    if (adminUserError) {
      console.error('Error creating user with admin API:', adminUserError);
    } else {
      console.log('User created successfully with admin API');
      const userId = adminUserData.user.id;
      console.log('User ID:', userId);
      console.log('User metadata:', adminUserData.user.user_metadata);
      
      // STEP 5: Check if trigger created user record
      console.log('\n--- CHECKING IF TRIGGER CREATED USER RECORD ---');
      
      // Wait a moment for trigger to execute
      console.log('Waiting for trigger to execute...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for user record with id
      const { data: userById, error: userByIdError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userByIdError) {
        console.error('Error checking for user by id:', userByIdError);
        
        // Try with auth_id if id doesn't work
        console.log('Trying to find user with auth_id field...');
        const { data: userByAuthId, error: userByAuthIdError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('auth_id', userId)
          .single();
        
        if (userByAuthIdError) {
          console.error('Error checking for user by auth_id:', userByAuthIdError);
          console.log('No user record found in users table');
        } else {
          console.log('User record found by auth_id:', userByAuthId);
        }
      } else {
        console.log('User record found by id:', userById);
      }
      
      // STEP 6: Try to manually create user record
      console.log('\n--- ATTEMPTING MANUAL USER RECORD CREATION ---');
      
      // First try with id field
      try {
        console.log('Trying to create user record with id field...');
        const { data: manualUserData, error: manualUserError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: userId,
            username: testUsername,
            email: testEmail,
            first_name: 'Debug',
            last_name: 'User',
          })
          .select()
          .single();
        
        if (manualUserError) {
          console.error('Error creating user record with id field:', manualUserError);
          
          // Try with auth_id if id doesn't work
          console.log('Trying with auth_id field instead...');
          const { data: authIdData, error: authIdError } = await supabaseAdmin
            .from('users')
            .upsert({
              auth_id: userId,
              username: testUsername,
              first_name: 'Debug',
              last_name: 'User',
            })
            .select()
            .single();
          
          if (authIdError) {
            console.error('Error creating user record with auth_id field:', authIdError);
          } else {
            console.log('User record created with auth_id:', authIdData);
          }
        } else {
          console.log('User record created with id:', manualUserData);
        }
      } catch (insertError) {
        console.error('Unexpected error during manual user creation:', insertError);
      }
      
      // STEP 7: Check database logs
      console.log('\n--- CHECKING DATABASE LOGS ---');
      try {
        const { data: logs, error: logsError } = await supabaseAdmin.rpc('pg_read_file', { 
          filename: 'pg_log/postgresql.log',
          offset: 0,
          length: 10000
        });
        
        if (logsError) {
          console.error('Error reading database logs:', logsError);
        } else {
          console.log('Recent database logs:', logs);
        }
      } catch (logsError) {
        console.error('Error accessing database logs:', logsError);
      }
      
      // STEP 8: Clean up test user
      console.log('\n--- CLEANING UP TEST USER ---');
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error('Error deleting test user:', deleteError);
      } else {
        console.log('Test user deleted successfully');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error during debugging:', error);
  }
}

// Run the debugging process
debugUserCreation().catch(error => {
  console.error('Fatal error:', error);
}); 