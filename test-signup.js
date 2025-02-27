// Test script to diagnose Supabase Auth sign-up issues
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://yrkfyqpqkjwhyosfykbh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTg1MDcsImV4cCI6MjA1NjE3NDUwN30.83gJiidaKbTrWD6k4prhQEO8fiPPxwbSu9I1TQVSoCA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5ODUwNywiZXhwIjoyMDU2MTc0NTA3fQ.JXHa42K4VhKJmAHbdARVi_UZbAJqGe8dAyZKh3rGFwM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Generate a unique email for testing
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'password123';
const testUsername = `user-${Date.now()}`;

async function testSignUp() {
  console.log('Starting sign-up test with:', { testEmail, testUsername });

  try {
    // STEP 0: Check database schema to diagnose issues
    console.log('\n=== CHECKING DATABASE SCHEMA ===');
    
    // Check users table schema
    console.log('\nChecking users table schema...');
    const { data: usersColumns, error: usersSchemaError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');
    
    if (usersSchemaError) {
      console.error('Error fetching users table schema:', usersSchemaError);
    } else {
      console.log('Users table columns:', usersColumns);
    }
    
    // Check auth.users table schema
    console.log('\nChecking auth.users table schema...');
    const { data: authUsersColumns, error: authUsersSchemaError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'auth');
    
    if (authUsersSchemaError) {
      console.error('Error fetching auth.users table schema:', authUsersSchemaError);
    } else {
      console.log('Auth.users table columns:', authUsersColumns);
    }
    
    // List all tables in public schema
    console.log('\nListing all tables in public schema...');
    const { data: publicTables, error: publicTablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (publicTablesError) {
      console.error('Error fetching public tables:', publicTablesError);
    } else {
      console.log('Public tables:', publicTables.map(t => t.table_name));
    }

    // STEP 1: Sign up with Supabase Auth
    console.log('\n=== ATTEMPTING USER SIGNUP ===');
    console.log('Attempting to sign up with Supabase Auth...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername,
          first_name: 'Test',
          last_name: 'User',
        },
      },
    });

    console.log('Sign-up response:', { 
      user: data?.user ? 'User created' : 'No user created',
      error: error ? error.message : 'No error'
    });
    
    if (error) {
      console.error('Sign-up error details:', error);
      return;
    }

    if (!data?.user) {
      console.error('User was not created in auth');
      return;
    }

    console.log('User created successfully in auth with ID:', data.user.id);
    console.log('User metadata:', data.user.user_metadata);

    // STEP 2: Check if the user exists in auth.users
    console.log('\n=== CHECKING USER IN AUTH.USERS ===');
    console.log('Checking if user exists in auth.users...');
    
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.rpc('get_auth_user', {
        user_id: data.user.id,
      });

      if (authError) {
        console.error('Error checking auth user:', authError);
        
        // Alternative way to check if RPC fails
        console.log('Trying direct query to auth.users...');
        const { data: directAuthUser, error: directAuthError } = await supabaseAdmin
          .from('auth.users')
          .select('id, email, raw_user_meta_data')
          .eq('id', data.user.id)
          .single();
          
        if (directAuthError) {
          console.error('Error with direct auth.users query:', directAuthError);
        } else {
          console.log('Direct auth.users query result:', directAuthUser);
        }
      } else {
        console.log('Auth user check result:', authUsers);
      }
    } catch (rpcError) {
      console.error('RPC error:', rpcError);
    }

    // STEP 3: Check if trigger created user record
    console.log('\n=== CHECKING USER IN PUBLIC.USERS ===');
    console.log('Checking if user record was created automatically...');
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (existingUserError) {
      console.error('Error checking existing user:', existingUserError);
      
      // Try with auth_id if id doesn't work
      console.log('Trying to find user with auth_id field...');
      const { data: authIdUser, error: authIdError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();
        
      if (authIdError) {
        console.error('Error checking user by auth_id:', authIdError);
      } else {
        console.log('User found by auth_id:', authIdUser);
      }
    } else {
      console.log('Existing user record:', existingUser);
    }

    // STEP 4: Try to manually create user record
    console.log('\n=== ATTEMPTING MANUAL USER CREATION ===');
    console.log('Attempting to create user record manually...');
    
    try {
      // First try with 'id' field
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          username: testUsername,
          email: testEmail,
          first_name: 'Test',
          last_name: 'User',
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user record with id field:', userError);
        
        // Try with auth_id if id doesn't work
        console.log('Trying with auth_id field instead...');
        const { data: authIdData, error: authIdError } = await supabaseAdmin
          .from('users')
          .insert({
            auth_id: data.user.id,
            username: testUsername,
            first_name: 'Test',
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
        console.log('User record created successfully:', userData);
      }
    } catch (insertError) {
      console.error('Unexpected error during user creation:', insertError);
    }

  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
}

// Create the get_auth_user function if it doesn't exist
async function createGetAuthUserFunction() {
  console.log('Checking if get_auth_user function exists...');
  
  try {
    const { data, error } = await supabaseAdmin.rpc('get_auth_user', { user_id: '00000000-0000-0000-0000-000000000000' });
    
    if (error && error.message.includes('function does not exist')) {
      console.log('Creating get_auth_user function...');
      
      const { error: createError } = await supabaseAdmin.rpc('create_get_auth_user_function');
      
      if (createError) {
        console.error('Error creating function:', createError);
        
        // Try creating the function directly
        const createFunctionSQL = `
          CREATE OR REPLACE FUNCTION get_auth_user(user_id UUID)
          RETURNS SETOF auth.users
          LANGUAGE sql
          SECURITY DEFINER
          SET search_path = auth
          AS $$
            SELECT * FROM auth.users WHERE id = user_id;
          $$;
        `;
        
        const { error: directCreateError } = await supabaseAdmin.rpc('exec_sql', { sql: createFunctionSQL });
        
        if (directCreateError) {
          console.error('Error creating function directly:', directCreateError);
        } else {
          console.log('Function created directly');
        }
      } else {
        console.log('Function created successfully');
      }
    } else {
      console.log('Function already exists');
    }
  } catch (error) {
    console.error('Error checking/creating function:', error);
  }
}

// Run the tests
async function runTests() {
  try {
    await createGetAuthUserFunction();
    await testSignUp();
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Execute the tests
runTests(); 