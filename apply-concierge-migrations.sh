#!/bin/bash

# Concierge Shift Report System - Migration Application Script
# This script applies all necessary database migrations for the new system

set -e  # Exit on error

echo "🚀 Concierge Shift Report System - Migration Application"
echo "=========================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

echo "📋 Checking migration files..."
MIGRATIONS=(
    "20260131174712_create_concierge_drafts.sql"
    "20260131174713_create_concierge_helpers.sql"
    "20260131174714_expand_daily_report_history.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "supabase/migrations/$migration" ]; then
        echo "  ✓ Found: $migration"
    else
        echo "  ❌ Missing: $migration"
        exit 1
    fi
done

echo ""
echo "✅ All migration files present"
echo ""

# Ask for confirmation
read -p "🔄 Apply migrations to remote database? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled by user"
    exit 0
fi

echo ""
echo "📤 Pushing migrations to remote database..."
npx supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations applied successfully!"
    echo ""
    echo "📋 Verifying migrations..."
    npx supabase migration list
    echo ""
    echo "🎉 Migration complete!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy Edge Function: npx supabase functions deploy submit-concierge-report"
    echo "2. Enable Realtime on concierge_drafts table (see CONCIERGE_SYSTEM_DEPLOYMENT.md)"
    echo "3. Deploy frontend changes"
    echo "4. Run tests from CONCIERGE_SYSTEM_DEPLOYMENT.md"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Check the error messages above for details."
    exit 1
fi
