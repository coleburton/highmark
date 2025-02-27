const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://yrkfyqpqkjwhyosfykbh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is not set');
  console.log('Please run the script with the service key:');
  console.log('SUPABASE_SERVICE_KEY=your_service_key node run-fix-schema.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSqlScript() {
  try {
    console.log('Starting schema fix process...');
    
    // Read the SQL script
    const sqlFilePath = path.join(__dirname, 'fix-schema.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Error: SQL file not found at ${sqlFilePath}`);
      process.exit(1);
    }
    
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the script into individual commands
    // This is a simple split and might not work for all SQL scripts
    // For more complex scripts, consider using a proper SQL parser
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    console.log(`Found ${commands.length} SQL commands to execute`);
    
    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\nExecuting command ${i + 1}/${commands.length}:`);
      console.log(command.substring(0, 100) + (command.length > 100 ? '...' : ''));
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error(`Error executing command ${i + 1}:`, error);
          // Continue with next command instead of failing completely
        } else {
          console.log(`Command ${i + 1} executed successfully`);
        }
      } catch (cmdError) {
        console.error(`Exception executing command ${i + 1}:`, cmdError.message);
        // Try alternative method if exec_sql fails
        try {
          console.log('Trying alternative method...');
          const { data, error } = await supabase.from('_exec_sql').select('*').eq('sql', command);
          
          if (error) {
            console.error(`Alternative method failed for command ${i + 1}:`, error);
          } else {
            console.log(`Command ${i + 1} executed successfully with alternative method`);
          }
        } catch (altError) {
          console.error(`Alternative method exception for command ${i + 1}:`, altError.message);
        }
      }
    }
    
    // Verify changes
    console.log('\nVerifying changes...');
    
    // Check if email column exists
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .limit(1);
      
      if (error) {
        console.error('Error verifying email column:', error);
      } else {
        console.log('Email column exists in users table');
      }
    } catch (verifyError) {
      console.error('Exception verifying email column:', verifyError.message);
    }
    
    console.log('\nSchema fix process completed');
    console.log('Please check the logs above for any errors');
    console.log('If there were errors, you may need to run the SQL commands manually in the Supabase SQL Editor');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

runSqlScript().catch(console.error); 