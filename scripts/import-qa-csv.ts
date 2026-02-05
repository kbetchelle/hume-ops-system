/**
 * Q&A CSV Import Script
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/import-qa-csv.ts /path/to/csv
 *
 * Or set SUPABASE_SERVICE_ROLE_KEY in your environment.
 * Get the service role key from: Supabase Dashboard > Settings > API > service_role key
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://rywcqacxnwwpynriffer.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role key');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/import-qa-csv.ts /path/to/csv');
  process.exit(1);
}

const csvFilePath = process.argv[2];
if (!csvFilePath) {
  console.error('Error: CSV file path required');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/import-qa-csv.ts /path/to/csv');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CSVRow {
  id: string;
  question: string;
  answer: string;
  resolved: string;
  asked_by: string;
  answered_by: string;
  concierge_report_id: string;
  created_at: string;
  updated_at: string;
  parent_id: string;
  asked_by_id: string;
  answered_by_id: string;
}

interface StaffQARecord {
  id: string;
  question: string;
  answer: string | null;
  is_resolved: boolean;
  asked_by_name: string;
  answered_by_name: string | null;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  asked_by_id: string | null;
  answered_by_id: string | null;
  answer_type: 'direct_answer' | 'policy_link';
  is_public: boolean;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(';');

  return lines.slice(1).map(line => {
    const values = line.split(';');
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    return row as CSVRow;
  });
}

function transformRow(row: CSVRow): StaffQARecord {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer || null,
    is_resolved: row.resolved?.toLowerCase() === 'true',
    asked_by_name: row.asked_by || 'Unknown',
    answered_by_name: row.answered_by || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    parent_id: row.parent_id || null,
    asked_by_id: row.asked_by_id || null,
    answered_by_id: row.answered_by_id || null,
    answer_type: 'direct_answer',
    is_public: true,
  };
}

async function importQA() {
  console.log(`Reading CSV from: ${csvFilePath}`);

  const absolutePath = path.resolve(csvFilePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const rows = parseCSV(content);

  console.log(`Found ${rows.length} records to import`);

  const records = rows.map(transformRow);

  // Use upsert to handle existing records
  const { data, error } = await supabase
    .from('staff_qa')
    .upsert(records, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }

  console.log(`Successfully imported ${data?.length || 0} records`);
  console.log('\nImported questions:');
  records.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.question.substring(0, 60)}${r.question.length > 60 ? '...' : ''}`);
  });
}

importQA().catch(console.error);
