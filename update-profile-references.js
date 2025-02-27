// Script to update references from profiles to users in the codebase
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const rootDir = process.cwd();
const backupDir = path.join(rootDir, 'backups');
const logFile = 'update-references.log';
const excludeDirs = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache'
];

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Initialize log file
fs.writeFileSync(logFile, `=== PROFILE TO USER REFERENCE UPDATE LOG ===\n\n`);

// Function to log messages
function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, `${message}\n`);
}

// Function to update references from profiles to users
async function updateProfileReferences() {
  log('=== UPDATING REFERENCES FROM PROFILES TO USERS ===');
  
  try {
    // Use grep to find all references to profiles
    log('Searching for references to profiles table...');
    
    const grepCommand = `grep -r --include="*.{js,jsx,ts,tsx,vue,svelte,html,sql}" -l "profiles" ${rootDir} | grep -v "${excludeDirs.join('\\|')}"`;
    
    log(`Executing: ${grepCommand}`);
    
    const filesWithReferences = execSync(grepCommand, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    log(`Found ${filesWithReferences.length} files with references to profiles`);
    
    // Process each file
    for (const filePath of filesWithReferences) {
      const relativePath = path.relative(rootDir, filePath);
      log(`\nProcessing: ${relativePath}`);
      
      // Create backup
      const backupPath = path.join(backupDir, relativePath);
      const backupDirPath = path.dirname(backupPath);
      
      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }
      
      fs.copyFileSync(filePath, backupPath);
      log(`Created backup: ${backupPath}`);
      
      // Read file content
      let fileContent = fs.readFileSync(filePath, 'utf8');
      const originalContent = fileContent;
      
      // Perform replacements
      const replacements = [
        // SQL and Supabase queries
        { from: /from\s+['"]?profiles['"]?/gi, to: 'from "users"' },
        { from: /join\s+['"]?profiles['"]?/gi, to: 'join "users"' },
        { from: /\.from\(['"]profiles['"]\)/g, to: '.from("users")' },
        
        // TypeScript/JavaScript types and interfaces
        { from: /interface\s+Profile/g, to: 'interface User' },
        { from: /type\s+Profile/g, to: 'type User' },
        { from: /Profile\[\]/g, to: 'User[]' },
        { from: /:\s*Profile(\s|,|;|\)|\})/g, to: ': User$1' },
        
        // Variable names (more careful with these)
        { from: /const\s+profile\s*=/g, to: 'const user =' },
        { from: /let\s+profile\s*=/g, to: 'let user =' },
        { from: /var\s+profile\s*=/g, to: 'var user =' },
        
        // Function parameters and returns
        { from: /\(\s*profile\s*:/g, to: '(user:' },
        { from: /function\s+\w+\(\s*profile\s*[,)]/g, function(match) { return match.replace('profile', 'user'); } },
        
        // React components and props
        { from: /<Profile(\s|>)/g, to: '<User$1' },
        { from: /profile={/g, to: 'user={' },
        
        // Common variable usages (be careful with these)
        { from: /profile\./g, to: 'user.' },
        { from: /profiles\./g, to: 'users.' },
        
        // Table name references
        { from: /'profiles'/g, to: "'users'" },
        { from: /"profiles"/g, to: '"users"' },
        { from: /`profiles`/g, to: '`users`' }
      ];
      
      // Apply replacements
      let changesCount = 0;
      
      for (const { from, to } of replacements) {
        const beforeCount = fileContent.match(from)?.length || 0;
        if (typeof to === 'function') {
          fileContent = fileContent.replace(from, to);
        } else {
          fileContent = fileContent.replace(from, to);
        }
        
        if (beforeCount > 0) {
          log(`  - Replaced "${from}" with "${to}" (${beforeCount} occurrences)`);
          changesCount += beforeCount;
        }
      }
      
      // Write updated content if changes were made
      if (fileContent !== originalContent) {
        fs.writeFileSync(filePath, fileContent);
        log(`Updated ${changesCount} references in ${relativePath}`);
      } else {
        log(`No changes made to ${relativePath}`);
      }
    }
    
    log('\n=== UPDATE COMPLETE ===');
    log(`Updated references in ${filesWithReferences.length} files`);
    log(`Backups saved to: ${backupDir}`);
    log(`Log saved to: ${logFile}`);
    
  } catch (error) {
    log(`\nERROR: ${error.message}`);
    console.error(error);
  }
}

// Run the function
updateProfileReferences().catch(error => {
  log(`\nFATAL ERROR: ${error.message}`);
  console.error(error);
}); 