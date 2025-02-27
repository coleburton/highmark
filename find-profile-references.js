// Script to find all references to the profiles table in the codebase
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const rootDir = process.cwd();
const outputFile = 'profile-references.md';
const excludeDirs = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache'
];

// Function to find all references to profiles table
function findProfileReferences() {
  console.log('=== FINDING REFERENCES TO PROFILES TABLE ===');
  
  try {
    // Use grep to find all references to profiles
    console.log('Searching for references to profiles table...');
    
    const grepCommand = `grep -r --include="*.{js,jsx,ts,tsx,vue,svelte,html,sql}" -l "profiles" ${rootDir} | grep -v "${excludeDirs.join('\\|')}"`;
    
    console.log(`Executing: ${grepCommand}`);
    
    const filesWithReferences = execSync(grepCommand, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    console.log(`Found ${filesWithReferences.length} files with references to profiles`);
    
    // Generate a report
    let report = `# Profiles Table References\n\n`;
    report += `This report lists all files that reference the \`profiles\` table in the codebase.\n\n`;
    report += `## Files to Update\n\n`;
    
    // Process each file
    for (const filePath of filesWithReferences) {
      const relativePath = path.relative(rootDir, filePath);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Find specific lines with profiles references
      const lines = fileContent.split('\n');
      const referencesLines = [];
      
      lines.forEach((line, index) => {
        if (line.includes('profiles') || 
            line.includes('profile') && 
            (line.includes('table') || 
             line.includes('from') || 
             line.includes('join') || 
             line.includes('select') || 
             line.includes('insert') || 
             line.includes('update') || 
             line.includes('delete'))) {
          referencesLines.push({
            lineNumber: index + 1,
            content: line.trim()
          });
        }
      });
      
      if (referencesLines.length > 0) {
        report += `### ${relativePath}\n\n`;
        report += `\`\`\`\n`;
        
        referencesLines.forEach(line => {
          report += `Line ${line.lineNumber}: ${line.content}\n`;
        });
        
        report += `\`\`\`\n\n`;
        
        // Suggest changes
        report += `#### Suggested Changes\n\n`;
        report += `- Replace references to \`profiles\` table with \`users\` table\n`;
        report += `- Update column references if needed\n\n`;
      }
    }
    
    // Add migration guide
    report += `## Migration Guide\n\n`;
    report += `### Common Patterns to Replace\n\n`;
    report += `1. SQL queries:\n`;
    report += `   - \`FROM profiles\` → \`FROM users\`\n`;
    report += `   - \`JOIN profiles\` → \`JOIN users\`\n\n`;
    report += `2. Supabase queries:\n`;
    report += `   - \`.from('profiles')\` → \`.from('users')\`\n\n`;
    report += `3. TypeScript/JavaScript:\n`;
    report += `   - \`interface Profile\` → \`interface User\`\n`;
    report += `   - \`type Profile\` → \`type User\`\n\n`;
    
    // Write the report to a file
    fs.writeFileSync(outputFile, report);
    
    console.log(`Report generated: ${outputFile}`);
    
  } catch (error) {
    console.error('Error finding profile references:', error);
  }
}

// Run the function
findProfileReferences(); 