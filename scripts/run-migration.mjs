#!/usr/bin/env node

/**
 * Supabase Migration Script using Supabase MCP
 * This script executes the database schema migration
 */

const fs = await import('fs');
const path = await import('path');
const { fileURLToPath } = await import('url');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the schema SQL
const schemaPath = path.join(__dirname, '../supabase/schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf-8');

console.log('Migration SQL loaded, length:', sql.length);
console.log('First 200 chars:', sql.substring(0, 200));

// Break into individual statements
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))
  .map(s => s + ';');

console.log('\nTotal statements to execute:', statements.length);
console.log('\nStatements:');
statements.forEach((s, i) => {
  console.log(`${i + 1}.`, s.substring(0, 60) + '...');
});

// For MCP integration - the statements need to be executed via MCP
export { statements };
