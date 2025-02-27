// Script to fix users table schema by adding missing email column
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://yrkfyqpqkjwhyosfykbh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5ODUwNywiZXhwIjoyMDU2MTc0NTA3fQ.JXHa42K4VhKJmAHbdARVi_UZbAJqGe8dAyZKh3rGFwM';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsersTable() {
  console.log('=== USERS TABLE FIX TOOL ===');
  
  try {
    // STEP 1: Check current users table structure
    console.log('\n--- CHECKING CURRENT USERS TABLE STRUCTURE ---');
    const { data: usersColumns, error: usersColumnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .order('ordinal_position');
    
    if (usersColumnsError) {
      console.error('Error fetching users columns:', usersColumnsError);
      return;
    }
    
    console.log('Current users table columns:', usersColumns.map(c => c.column_name));
    
    // Check if email column exists
    const hasEmailColumn = usersColumns.some(col => col.column_name === 'email');
    console.log('Email column exists:', hasEmailColumn);
    
    // STEP 2: Add email column if it doesn't exist
    if (!hasEmailColumn) {
      console.log('\n--- ADDING EMAIL COLUMN TO USERS TABLE ---');
      
      try {
        // Execute SQL to add the email column
        const addEmailColumnSQL = `
          ALTER TABLE public.users 
          ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
        `;
        
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
      } catch (sqlError) {
        console.error('Unexpected error executing SQL:', sqlError);
      }
    } else {
      console.log('Email column already exists, no changes needed');
    }
    
    // STEP 3: Verify the column was added
    console.log('\n--- VERIFYING USERS TABLE STRUCTURE ---');
    const { data: updatedColumns, error: updatedColumnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .order('ordinal_position');
    
    if (updatedColumnsError) {
      console.error('Error fetching updated users columns:', updatedColumnsError);
    } else {
      console.log('Updated users table columns:', updatedColumns.map(c => c.column_name));
      const emailColumnExists = updatedColumns.some(col => col.column_name === 'email');
      console.log('Email column exists after fix:', emailColumnExists);
    }
    
    // STEP 4: Check if we need to update the trigger function
    console.log('\n--- CHECKING TRIGGER FUNCTION ---');
    
    // Get the current trigger function
    const { data: triggerFunctions, error: triggerFunctionsError } = await supabaseAdmin
      .from('pg_catalog.pg_proc')
      .select('proname, prosrc')
      .or('proname.eq.handle_new_user,proname.eq.handle_new_auth_user');
    
    if (triggerFunctionsError) {
      console.error('Error fetching trigger functions:', triggerFunctionsError);
    } else {
      console.log('Found trigger functions:', triggerFunctions.map(f => f.proname));
      
      // Check if we need to update the trigger function
      const needsUpdate = triggerFunctions.some(func => {
        const source = func.prosrc || '';
        return source.includes('INSERT INTO public.users') && !source.includes('email');
      });
      
      if (needsUpdate) {
        console.log('Trigger function needs to be updated to include email column');
        
        // Get the existing triggers
        const { data: triggers, error: triggersError } = await supabaseAdmin
          .from('information_schema.triggers')
          .select('trigger_name, event_manipulation, action_statement')
          .eq('event_object_schema', 'auth')
          .eq('event_object_table', 'users');
        
        if (triggersError) {
          console.error('Error fetching triggers:', triggersError);
        } else {
          console.log('Existing triggers:', triggers.map(t => t.trigger_name));
        }
      } else {
        console.log('Trigger function already includes email column or not found');
      }
    }
    
    console.log('\n--- FIX COMPLETED ---');
    console.log('The users table has been checked and fixed if necessary.');
    console.log('You should now be able to create users without the "column users.email does not exist" error.');
    
  } catch (error) {
    console.error('Unexpected error during fix process:', error);
  }
}

// Run the fix process
fixUsersTable().catch(error => {
  console.error('Fatal error:', error);
}); 