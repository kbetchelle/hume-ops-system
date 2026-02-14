/**
 * Migration Script: Convert Resource Pages from HTML to TipTap JSON
 * 
 * This script migrates existing resource_pages content from legacy HTML format
 * to the new TipTap JSON format with proper formatting preservation.
 * 
 * Usage:
 *   npm run tsx src/scripts/migrateResourcePagesToTiptap.ts [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run: Preview changes without applying them
 *   --verbose: Show detailed output for each page
 */

import { createClient } from "@supabase/supabase-js";
import { htmlToTiptapJson } from "../lib/htmlToTiptapJson";
import { extractSearchText } from "../lib/extractSearchText";
import type { Database } from "../integrations/supabase/types";

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase environment variables");
  console.error("   Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isVerbose = args.includes("--verbose");

interface MigrationResult {
  id: string;
  title: string;
  success: boolean;
  error?: string;
  htmlLength: number;
  jsonNodeCount: number;
}

async function migratePages(): Promise<void> {
  console.log("\n📄 Resource Pages HTML → TipTap JSON Migration");
  console.log("================================================\n");

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE: No changes will be applied\n");
  }

  // Fetch all pages that have HTML content but need migration
  console.log("Fetching pages to migrate...");
  const { data: pages, error: fetchError } = await supabase
    .from("resource_pages")
    .select("id, title, content, content_json")
    .not("content", "is", null);

  if (fetchError) {
    console.error("❌ Error fetching pages:", fetchError.message);
    process.exit(1);
  }

  if (!pages || pages.length === 0) {
    console.log("✅ No pages found to migrate");
    return;
  }

  console.log(`Found ${pages.length} page(s) with HTML content\n`);

  const results: MigrationResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Process each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + 1;

    if (isVerbose) {
      console.log(`\n[${pageNum}/${pages.length}] Processing: "${page.title}"`);
      console.log(`   ID: ${page.id}`);
    } else {
      process.stdout.write(`\rProcessing ${pageNum}/${pages.length}...`);
    }

    try {
      // Skip if content is empty
      if (!page.content || page.content.trim() === "") {
        if (isVerbose) {
          console.log("   ⚠️  Skipped: Empty content");
        }
        results.push({
          id: page.id,
          title: page.title,
          success: true,
          htmlLength: 0,
          jsonNodeCount: 0,
        });
        successCount++;
        continue;
      }

      // Convert HTML to TipTap JSON
      const contentJson = htmlToTiptapJson(page.content);
      const searchText = extractSearchText(contentJson);

      // Count nodes in the JSON structure
      const nodeCount = countNodes(contentJson);

      if (isVerbose) {
        console.log(`   HTML length: ${page.content.length} chars`);
        console.log(`   Generated ${nodeCount} node(s)`);
        console.log(`   Search text: ${searchText.substring(0, 100)}${searchText.length > 100 ? "..." : ""}`);
      }

      // Update the database (unless dry run)
      if (!isDryRun) {
        const { error: updateError } = await supabase
          .from("resource_pages")
          .update({
            content_json: contentJson,
            search_text: searchText,
          })
          .eq("id", page.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        if (isVerbose) {
          console.log("   ✅ Updated successfully");
        }
      } else if (isVerbose) {
        console.log("   ℹ️  Would update (dry run)");
      }

      results.push({
        id: page.id,
        title: page.title,
        success: true,
        htmlLength: page.content.length,
        jsonNodeCount: nodeCount,
      });
      successCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (isVerbose) {
        console.log(`   ❌ Error: ${errorMessage}`);
      }

      results.push({
        id: page.id,
        title: page.title,
        success: false,
        error: errorMessage,
        htmlLength: page.content?.length || 0,
        jsonNodeCount: 0,
      });
      errorCount++;
    }
  }

  // Clear progress line if not verbose
  if (!isVerbose) {
    process.stdout.write("\r");
  }

  // Print summary
  console.log("\n\n📊 Migration Summary");
  console.log("====================");
  console.log(`Total pages: ${pages.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);

  // Show failed pages if any
  if (errorCount > 0) {
    console.log("\n❌ Failed Pages:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - "${r.title}" (${r.id})`);
        console.log(`     Error: ${r.error}`);
      });
  }

  // Show statistics
  if (successCount > 0) {
    const totalHtmlChars = results
      .filter((r) => r.success)
      .reduce((sum, r) => sum + r.htmlLength, 0);
    const totalNodes = results
      .filter((r) => r.success)
      .reduce((sum, r) => sum + r.jsonNodeCount, 0);
    const avgNodes = totalNodes / successCount;

    console.log("\n📈 Statistics:");
    console.log(`   Total HTML chars migrated: ${totalHtmlChars.toLocaleString()}`);
    console.log(`   Total TipTap nodes created: ${totalNodes}`);
    console.log(`   Average nodes per page: ${avgNodes.toFixed(1)}`);
  }

  if (isDryRun) {
    console.log("\n💡 This was a dry run. Run without --dry-run to apply changes.");
  } else {
    console.log("\n✨ Migration complete!");
  }
}

/**
 * Recursively count nodes in TipTap JSON structure
 */
function countNodes(content: any): number {
  if (!content) return 0;
  
  let count = 1; // Count this node
  
  if (content.content && Array.isArray(content.content)) {
    for (const child of content.content) {
      count += countNodes(child);
    }
  }
  
  return count;
}

// Run migration
migratePages()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
