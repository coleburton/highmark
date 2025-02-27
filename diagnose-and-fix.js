// Comprehensive script to diagnose and fix user creation issues
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://yrkfyqpqkjwhyosfykbh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTg1MDcsImV4cCI6MjA1NjE3NDUwN30.83gJiidaKbTrWD6k4prhQEO8fiPPxwbSu9I1TQVSoCA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5ODUwNywiZXhwIjoyMDU2MTc0NTA3fQ.JXHa42K4VhKJmAHbdARVi_UZbAJqGe8dAyZKh3rGFwM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Generate a unique email for testing
const testEmail = `diagnostic-${Date.now()}@example.com`;
const testPassword = 'password123';
const testUsername = `diagnostic-${Date.now()}`;

async function runDiagnostics() {
  console.log('=== COMPREHENSIVE DIAGNOSTIC AND FIX TOOL ===');
  console.log('This tool will diagnose and attempt to fix user creation issues');
  console.log('Test credentials:', { email: testEmail, username: testUsername });
  
  try {
    // PHASE 1: Check database schema
    console.log('\n\n=== PHASE 1: DATABASE SCHEMA CHECK ===');
    
    // Check users table structure
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
      console.log('Users table columns:', usersColumns.map(c => c.column_name).join(', '));
      
      // Check if email column exists
      const hasEmailColumn = usersColumns.some(col => col.column_name === 'email');
      console.log('Email column exists:', hasEmailColumn);
      
      // Check if auth_id column exists
      const hasAuthIdColumn = usersColumns.some(col => col.column_name === 'auth_id');
      console.log('Auth_id column exists:', hasAuthIdColumn);
      
      // Check primary key column
      const primaryKeyColumn = usersColumns.find(col => 
        col.column_default && col.column_default.includes('nextval') || 
        col.column_name === 'id'
      );
      console.log('Primary key column:', primaryKeyColumn ? primaryKeyColumn.column_name : 'Not found');
    }
    
    // Check auth.users table structure
    console.log('\n--- CHECKING AUTH.USERS TABLE STRUCTURE ---');
    const { data: authUsersColumns, error: authUsersColumnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'auth')
      .eq('table_name', 'users')
      .order('ordinal_position');
    
    if (authUsersColumnsError) {
      console.error('Error fetching auth.users columns:', authUsersColumnsError);
    } else {
      console.log('Auth.users columns:', authUsersColumns.map(c => c.column_name).join(', '));
    }
    
    // Check triggers on auth.users
    console.log('\n--- CHECKING TRIGGERS ON AUTH.USERS ---');
    const { data: triggers, error: triggersError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('event_object_schema', 'auth')
      .eq('event_object_table', 'users');
    
    if (triggersError) {
      console.error('Error fetching triggers:', triggersError);
    } else {
      console.log('Triggers on auth.users:', triggers.map(t => t.trigger_name).join(', '));
    }
    
    // PHASE 2: Fix missing email column if needed
    console.log('\n\n=== PHASE 2: FIX MISSING EMAIL COLUMN ===');
    
    if (usersColumns && !usersColumns.some(col => col.column_name === 'email')) {
      console.log('Email column is missing, attempting to add it...');
      
      try {
        // Execute SQL to add the email column
        const addEmailColumnSQL = `
          ALTER TABLE public.users 
          ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
        `;
        
        try {
          const { error: alterError } = await supabaseAdmin.rpc('exec_sql', { sql: addEmailColumnSQL });
          
          if (alterError) {
            console.error('Error executing SQL to add email column:', alterError);
            
            // Try alternative approach with direct SQL
            console.log('Trying alternative approach...');
            
            const { error: directSqlError } = await supabaseAdmin
              .from('_sql')
              .select('*')
              .execute(addEmailColumnSQL);
            
            if (directSqlError) {
              console.error('Error with direct SQL execution:', directSqlError);
            } else {
              console.log('Email column added successfully via direct SQL');
            }
          } else {
            console.log('Email column added successfully');
          }
        } catch (rpcError) {
          console.error('RPC error:', rpcError);
          
          // Try another approach
          console.log('Trying another approach with raw SQL...');
          
          try {
            // This is a more direct approach but may not work in all environments
            const { data, error } = await supabaseAdmin
              .from('_sql')
              .select('*')
              .execute(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;`);
            
            if (error) {
              console.error('Error with raw SQL execution:', error);
            } else {
              console.log('Email column added successfully via raw SQL');
            }
          } catch (rawSqlError) {
            console.error('Raw SQL error:', rawSqlError);
          }
        }
      } catch (sqlError) {
        console.error('Unexpected error executing SQL:', sqlError);
      }
      
      // Verify the column was added
      console.log('\n--- VERIFYING COLUMN ADDITION ---');
      const { data: updatedColumns, error: updatedColumnsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'users')
        .eq('column_name', 'email');
      
      if (updatedColumnsError) {
        console.error('Error verifying column addition:', updatedColumnsError);
      } else {
        console.log('Email column exists after fix:', updatedColumns.length > 0);
      }
    } else {
      console.log('Email column already exists, no fix needed');
    }
    
    // PHASE 3: Test user creation
    console.log('\n\n=== PHASE 3: TEST USER CREATION ===');
    
    // Try to create a user with admin API
    console.log('\n--- CREATING TEST USER WITH ADMIN API ---');
    const { data: adminUserData, error: adminUserError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        username: testUsername,
        first_name: 'Diagnostic',
        last_name: 'Test',
      },
    });
    
    if (adminUserError) {
      console.error('Error creating user with admin API:', adminUserError);
    } else {
      console.log('User created successfully with admin API');
      const userId = adminUserData.user.id;
      console.log('User ID:', userId);
      
      // Wait for trigger to execute
      console.log('Waiting for trigger to execute...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if user record was created
      console.log('\n--- CHECKING IF USER RECORD WAS CREATED ---');
      const { data: userRecord, error: userRecordError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userRecordError) {
        console.error('Error checking user record:', userRecordError);
        
        // Try with auth_id if id doesn't work
        console.log('Trying to find user with auth_id field...');
        const { data: authIdUser, error: authIdError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('auth_id', userId)
          .single();
        
        if (authIdError) {
          console.error('Error checking user by auth_id:', authIdError);
          
          // Try to manually create the user record
          console.log('\n--- ATTEMPTING MANUAL USER RECORD CREATION ---');
          
          // First try with id field
          try {
            const { data: manualUserData, error: manualUserError } = await supabaseAdmin
              .from('users')
              .upsert({
                id: userId,
                username: testUsername,
                email: testEmail,
                first_name: 'Diagnostic',
                last_name: 'Test',
              })
              .select()
              .single();
            
            if (manualUserError) {
              console.error('Error creating user record with id field:', manualUserError);
              
              // Try with auth_id if id doesn't work
              if (hasAuthIdColumn) {
                console.log('Trying with auth_id field instead...');
                const { data: authIdData, error: authIdError } = await supabaseAdmin
                  .from('users')
                  .upsert({
                    auth_id: userId,
                    username: testUsername,
                    first_name: 'Diagnostic',
                    last_name: 'Test',
                  })
                  .select()
                  .single();
                
                if (authIdError) {
                  console.error('Error creating user record with auth_id field:', authIdError);
                } else {
                  console.log('User record created with auth_id:', authIdData);
                }
              }
            } else {
              console.log('User record created manually:', manualUserData);
            }
          } catch (insertError) {
            console.error('Unexpected error during manual user creation:', insertError);
          }
        } else {
          console.log('User record found by auth_id:', authIdUser);
        }
      } else {
        console.log('User record created automatically:', userRecord);
      }
      
      // Clean up test user
      console.log('\n--- CLEANING UP TEST USER ---');
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error('Error deleting test user:', deleteError);
      } else {
        console.log('Test user deleted successfully');
      }
    }
    
    // PHASE 4: Summary and recommendations
    console.log('\n\n=== PHASE 4: SUMMARY AND RECOMMENDATIONS ===');
    
    if (usersColumns) {
      const hasEmailColumn = usersColumns.some(col => col.column_name === 'email');
      const hasAuthIdColumn = usersColumns.some(col => col.column_name === 'auth_id');
      
      console.log('\nDiagnostic Results:');
      console.log('- Email column exists:', hasEmailColumn);
      console.log('- Auth_id column exists:', hasAuthIdColumn);
      console.log('- Triggers on auth.users:', triggers ? triggers.length : 'Unknown');
      
      console.log('\nRecommendations:');
      
      if (!hasEmailColumn) {
        console.log('1. The email column is still missing from the users table. You need to add it with:');
        console.log('   ALTER TABLE public.users ADD COLUMN email TEXT UNIQUE;');
      }
      
      if (!triggers || triggers.length === 0) {
        console.log('2. There are no triggers on auth.users. You need to create a trigger to handle new user creation.');
      }
      
      if (hasEmailColumn && triggers && triggers.length > 0) {
        console.log('The basic requirements for user creation appear to be met.');
        console.log('If you are still experiencing issues, check the trigger function to ensure it correctly handles the email field.');
      }
    }
    
    console.log('\nDiagnostic process completed.');
    
  } catch (error) {
    console.error('Unexpected error during diagnostics:', error);
  }
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error('Fatal error:', error);
}); 