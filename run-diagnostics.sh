#!/bin/bash

# Script to run the diagnostic tools for user creation issues

echo "=== SUPABASE USER CREATION DIAGNOSTIC TOOLS ==="
echo "This script will run various diagnostic tools to help identify and fix user creation issues."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to run these diagnostic tools."
    exit 1
fi

# Check if the required diagnostic scripts exist
if [ ! -f "check-db-schema.js" ] || [ ! -f "debug-user-creation.js" ] || [ ! -f "fix-users-table.js" ] || [ ! -f "diagnose-and-fix.js" ]; then
    echo "Error: One or more diagnostic scripts are missing."
    echo "Make sure the following files exist in the current directory:"
    echo "- check-db-schema.js"
    echo "- debug-user-creation.js"
    echo "- fix-users-table.js"
    echo "- diagnose-and-fix.js"
    exit 1
fi

# Function to run a diagnostic script
run_script() {
    echo ""
    echo "Running $1..."
    echo "----------------------------------------"
    node "$1" | tee "$1.log"
    echo "----------------------------------------"
    echo "Log saved to $1.log"
    echo ""
}

# Main menu
while true; do
    echo ""
    echo "Select a diagnostic tool to run:"
    echo "1. Check Database Schema (check-db-schema.js)"
    echo "2. Debug User Creation Process (debug-user-creation.js)"
    echo "3. Fix Users Table (fix-users-table.js)"
    echo "4. Comprehensive Diagnosis and Fix (diagnose-and-fix.js)"
    echo "5. Run All Diagnostic Tools"
    echo ""
    echo "Schema Migration Tools:"
    echo "6. Consolidate Schema (consolidate-schema.js)"
    echo "7. Find Profile References (find-profile-references.js)"
    echo "8. Update Profile References (update-profile-references.js)"
    echo "9. Run Complete Migration"
    echo ""
    echo "Direct Schema Fix:"
    echo "10. Run SQL Schema Fix (run-fix-schema.js)"
    echo "11. View Fix Schema Instructions"
    echo ""
    echo "0. Exit"
    echo ""
    read -p "Enter your choice (0-11): " choice
    
    case $choice in
        1)
            run_script "check-db-schema.js"
            ;;
        2)
            run_script "debug-user-creation.js"
            ;;
        3)
            run_script "fix-users-table.js"
            ;;
        4)
            run_script "diagnose-and-fix.js"
            ;;
        5)
            echo ""
            echo "Running all diagnostic tools in sequence..."
            echo ""
            run_script "check-db-schema.js"
            run_script "debug-user-creation.js"
            run_script "fix-users-table.js"
            run_script "diagnose-and-fix.js"
            echo "All diagnostic tools have been run. Check the log files for details."
            ;;
        6)
            # Check if consolidate-schema.js exists
            if [ ! -f "consolidate-schema.js" ]; then
                echo "Error: consolidate-schema.js is missing."
                continue
            fi
            run_script "consolidate-schema.js"
            ;;
        7)
            # Check if find-profile-references.js exists
            if [ ! -f "find-profile-references.js" ]; then
                echo "Error: find-profile-references.js is missing."
                continue
            fi
            run_script "find-profile-references.js"
            echo "Report generated: profile-references.md"
            ;;
        8)
            # Check if update-profile-references.js exists
            if [ ! -f "update-profile-references.js" ]; then
                echo "Error: update-profile-references.js is missing."
                continue
            fi
            
            echo "WARNING: This will modify files in your codebase."
            read -p "Are you sure you want to continue? (y/n): " confirm
            if [ "$confirm" != "y" ]; then
                echo "Operation cancelled."
                continue
            fi
            
            run_script "update-profile-references.js"
            echo "Log saved to: update-references.log"
            echo "Backups saved to: backups/"
            ;;
        9)
            # Check if all migration scripts exist
            if [ ! -f "consolidate-schema.js" ] || [ ! -f "find-profile-references.js" ] || [ ! -f "update-profile-references.js" ]; then
                echo "Error: One or more migration scripts are missing."
                continue
            fi
            
            echo "WARNING: This will run the complete migration process:"
            echo "1. Consolidate database schema"
            echo "2. Find profile references in code"
            echo "3. Update profile references to users"
            echo ""
            echo "This will modify your database and codebase."
            read -p "Are you sure you want to continue? (y/n): " confirm
            if [ "$confirm" != "y" ]; then
                echo "Operation cancelled."
                continue
            fi
            
            echo ""
            echo "Running complete migration process..."
            echo ""
            run_script "consolidate-schema.js"
            run_script "find-profile-references.js"
            
            echo "About to update code references."
            read -p "Continue with code updates? (y/n): " confirm_code
            if [ "$confirm_code" != "y" ]; then
                echo "Code update skipped. Migration partially complete."
                continue
            fi
            
            run_script "update-profile-references.js"
            echo "Migration complete. Please review the logs and test your application."
            ;;
        10)
            # Check if run-fix-schema.js exists
            if [ ! -f "run-fix-schema.js" ] || [ ! -f "fix-schema.sql" ]; then
                echo "Error: run-fix-schema.js or fix-schema.sql is missing."
                continue
            fi
            
            echo "WARNING: This will directly modify your database schema."
            echo "It will add the email column to the users table and update the trigger function."
            read -p "Are you sure you want to continue? (y/n): " confirm
            if [ "$confirm" != "y" ]; then
                echo "Operation cancelled."
                continue
            fi
            
            echo ""
            echo "Please enter your Supabase service key:"
            read -p "SUPABASE_SERVICE_KEY: " service_key
            
            echo ""
            echo "Running SQL schema fix..."
            echo "----------------------------------------"
            SUPABASE_SERVICE_KEY="$service_key" node run-fix-schema.js | tee run-fix-schema.log
            echo "----------------------------------------"
            echo "Log saved to run-fix-schema.log"
            echo ""
            ;;
        11)
            # Check if FIX_SCHEMA_INSTRUCTIONS.md exists
            if [ ! -f "FIX_SCHEMA_INSTRUCTIONS.md" ]; then
                echo "Error: FIX_SCHEMA_INSTRUCTIONS.md is missing."
                continue
            fi
            
            # Display the instructions using a pager
            if command -v less &> /dev/null; then
                less FIX_SCHEMA_INSTRUCTIONS.md
            else
                cat FIX_SCHEMA_INSTRUCTIONS.md
            fi
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Please enter a number between 0 and 11."
            ;;
    esac
done 