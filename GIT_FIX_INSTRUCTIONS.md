# Git Repository Corruption Fix Guide

## Problem
Your Git repository has been corrupted by macOS metadata files (`._ prefixed files`), causing "non-monotonic index" errors. The repository is now unreadable.

## Solution: Clone Fresh and Reapply Changes

### Step 1: Backup Your Current Work
```bash
# Navigate to parent directory
cd /Volumes/SSDdeKat/HUME_project

# Create a backup of your working files (NOT the .git folder)
rsync -av --exclude='.git' --exclude='node_modules' hume-ops-system/ hume-ops-system-backup/
```

### Step 2: Remove Corrupted Repository
```bash
# Remove the corrupted repository
rm -rf hume-ops-system
```

### Step 3: Fresh Clone
```bash
# Clone fresh from GitHub
git clone git@github.com:kbetchelle/hume-ops-system.git

# Navigate into the new clone
cd hume-ops-system

# Switch to your branch if needed
git checkout notif-types-b4b33  # or whatever branch you were on
```

### Step 4: Reapply Your Changes
```bash
# Copy your changes from the backup (excluding .git)
rsync -av --exclude='.git' --exclude='node_modules' \
  ../hume-ops-system-backup/ ./

# Check what changed
git status

# Review the changes
git diff
```

### Step 5: Commit and Push
```bash
# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "Add staff messaging system (Phases 1-3) and fix bugs"

# Pull latest changes first (if any)
git pull origin notif-types-b4b33 --rebase

# Push your changes
git push origin notif-types-b4b33
```

## Prevention: Avoid Future Corruption

Add this to your `.gitattributes` file to prevent macOS metadata:
```bash
echo "._* export-ignore" >> .gitattributes
```

Add to your global Git config:
```bash
git config --global core.precomposeunicode true
git config --global core.protectNTFS false
```

## Alternative: Quick Fix (If You Just Want to Push)

If you just want to get your current changes pushed without the full clone:

```bash
# Save your current branch name
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "notif-types-b4b33")

# Create a new directory for fresh clone
cd /Volumes/SSDdeKat/HUME_project
git clone git@github.com:kbetchelle/hume-ops-system.git hume-ops-system-fresh
cd hume-ops-system-fresh
git checkout $CURRENT_BRANCH

# Copy ONLY your source files (not .git)
rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' \
  ../hume-ops-system/src/ ./src/
rsync -av --exclude='.git' ../hume-ops-system/supabase/migrations/ ./supabase/migrations/
rsync -av --exclude='.git' ../hume-ops-system/MESSAGING_IMPLEMENTATION_STATUS.md ./

# Commit and push
git add .
git commit -m "Add staff messaging system (Phases 1-3 complete) and bug fixes"
git pull origin $CURRENT_BRANCH --rebase
git push origin $CURRENT_BRANCH

# If successful, replace old directory
cd ..
mv hume-ops-system hume-ops-system-corrupted
mv hume-ops-system-fresh hume-ops-system
```

## What Caused This?

macOS creates `._` metadata files when files are accessed on certain volumes (like external drives). These corrupted your Git object database. The pack files became unreadable, and Git can't rebuild them because some objects are missing.

## Your Current Changes Are Safe

All your actual code changes (the 19 new files and 7 modified files from the messaging system implementation) are still in your working directory - they're just not in a pushable Git state. The fresh clone approach will get everything working again.
