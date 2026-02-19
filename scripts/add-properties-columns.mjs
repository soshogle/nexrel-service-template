#!/usr/bin/env node
/**
 * Add missing columns to properties table (is_prestige, is_secret).
 * Run when Drizzle queries fail with "column does not exist".
 * Usage: node scripts/add-properties-columns.mjs
 */
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: true } });

const sql = `
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_prestige boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_secret boolean DEFAULT false;
`;

async function main() {
  try {
    await client.connect();
    await client.query(sql);
    console.log("✅ Added is_prestige, is_secret to properties");
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
