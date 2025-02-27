// Script to check database schema and diagnose issues
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://yrkfyqpqkjwhyosfykbh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Z5cXBxa2p3aHlvc2Z5a2JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5ODUwNywiZXhwIjoyMDU2MTc0NTA3fQ.JXHa42K4VhKJmAHbdARVi_UZbAJqGe8dAyZKh3rGFwM';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  console.log('=== DATABASE SCHEMA DIAGNOSTIC TOOL ===');
  
  try {
    // List all schemas
    console.log('\n--- LISTING ALL SCHEMAS ---');
    const { data: schemas, error: schemasError } = await supabaseAdmin
      .from('information_schema.schemata')
      .select('schema_name')
      .order('schema_name');
    
    if (schemasError) {
      console.error('Error fetching schemas:', schemasError);
    } else {
      console.log('Available schemas:', schemas.map(s => s.schema_name));
    }
    
    // List all tables in public schema
    console.log('\n--- LISTING PUBLIC TABLES ---');
    const { data: publicTables, error: publicTablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (publicTablesError) {
      console.error('Error fetching public tables:', publicTablesError);
    } else {
      console.log('Public tables:', publicTables.map(t => t.table_name));
      
      // For each public table, get its columns
      for (const table of publicTables) {
        await checkTableColumns('public', table.table_name);
      }
    }
    
    // Check auth schema tables
    console.log('\n--- CHECKING AUTH SCHEMA ---');
    const { data: authTables, error: authTablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'auth')
      .order('table_name');
    
    if (authTablesError) {
      console.error('Error fetching auth tables:', authTablesError);
    } else {
      console.log('Auth tables:', authTables.map(t => t.table_name));
      
      // Check auth.users table specifically
      if (authTables.some(t => t.table_name === 'users')) {
        await checkTableColumns('auth', 'users');
      }
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
      console.log('Triggers on auth.users:', triggers);
    }
    
    // Check trigger functions
    console.log('\n--- CHECKING TRIGGER FUNCTIONS ---');
    const { data: functions, error: functionsError } = await supabaseAdmin
      .from('pg_catalog.pg_proc')
      .select('proname, prosrc')
      .contains('prosrc', 'auth.users');
    
    if (functionsError) {
      console.error('Error fetching trigger functions:', functionsError);
    } else {
      console.log('Functions related to auth.users:', functions);
    }
    
    // Check for migration history
    console.log('\n--- CHECKING MIGRATION HISTORY ---');
    const { data: migrations, error: migrationsError } = await supabaseAdmin
      .from('supabase_migrations.schema_migrations')
      .select('*')
      .order('version', { ascending: false })
      .limit(5);
    
    if (migrationsError) {
      console.error('Error fetching migration history:', migrationsError);
    } else {
      console.log('Recent migrations:', migrations);
    }
    
    // Check for RLS policies on users table
    console.log('\n--- CHECKING RLS POLICIES ---');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_catalog.pg_policies')
      .select('*')
      .eq('tablename', 'users');
    
    if (policiesError) {
      console.error('Error fetching RLS policies:', policiesError);
    } else {
      console.log('RLS policies on users table:', policies);
    }
    
  } catch (error) {
    console.error('Unexpected error during schema check:', error);
  }
}

async function checkTableColumns(schema, table) {
  console.log(`\n--- CHECKING COLUMNS FOR ${schema}.${table} ---`);
  
  try {
    const { data: columns, error } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', schema)
      .eq('table_name', table)
      .order('ordinal_position');
    
    if (error) {
      console.error(`Error fetching columns for ${schema}.${table}:`, error);
    } else {
      console.log(`Columns for ${schema}.${table}:`, columns);
    }
  } catch (error) {
    console.error(`Unexpected error checking columns for ${schema}.${table}:`, error);
  }
}

// Run the schema check
checkDatabaseSchema().catch(error => {
  console.error('Fatal error:', error);
}); 