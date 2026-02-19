#!/usr/bin/env node
/**
 * Verify listings in the database. Run from nexrel-service-template.
 * Usage: node scripts/verify-listings.mjs
 */
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL required. Set in .env");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: true } });

async function main() {
  try {
    await client.connect();
    const res = await client.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties'"
    );
    const tableExists = Number(res.rows[0]?.count || 0) > 0;
    if (!tableExists) {
      console.log("❌ properties table does not exist. Run: node scripts/create-properties-table.mjs");
      process.exit(1);
    }
    console.log("✅ properties table exists");

    const countRes = await client.query("SELECT COUNT(*) as count FROM properties");
    const count = Number(countRes.rows[0]?.count || 0);
    console.log(`   Total listings: ${count}`);

    const featuredRes = await client.query(
      "SELECT COUNT(*) as count FROM properties WHERE status = 'active' AND (is_featured = true OR is_featured IS NULL)"
    );
    const activeRes = await client.query(
      "SELECT COUNT(*) as count FROM properties WHERE status = 'active'"
    );
    console.log(`   Active listings: ${activeRes.rows[0]?.count || 0}`);

    if (count === 0) {
      console.log("\n📋 No listings. Import sample data:");
      console.log("   node scripts/import-listings.mjs data/sample-listings.json");
      console.log("\n   Or sync from Centris:");
      console.log("   npm run db:sync-centris");
    } else {
      const sample = await client.query("SELECT mls_number, title, slug, status FROM properties LIMIT 5");
      console.log("\n   Sample listings:");
      sample.rows.forEach((r) => console.log(`   - ${r.mls_number}: ${r.title} (${r.status})`));
    }
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
