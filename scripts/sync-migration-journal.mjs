#!/usr/bin/env node
/**
 * One-time script: Mark existing migrations as applied in drizzle.__drizzle_migrations.
 * Use when the DB already has the schema but the migration journal is out of sync.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import pg from "pg";

const { Client } = pg;

const journal = JSON.parse(
  fs.readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8")
);

const migrations = journal.entries.map((e) => {
  const path = new URL(`../drizzle/${e.tag}.sql`, import.meta.url);
  const query = fs.readFileSync(path, "utf8");
  return {
    hash: crypto.createHash("sha256").update(query).digest("hex"),
    created_at: e.when,
  };
});

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();

try {
  await client.query(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const { rows } = await client.query(
    `SELECT hash, created_at FROM "drizzle"."__drizzle_migrations" ORDER BY created_at`
  );
  const existing = new Set(rows.map((r) => `${r.hash}:${r.created_at}`));

  for (const m of migrations) {
    const key = `${m.hash}:${m.created_at}`;
    if (existing.has(key)) {
      console.log(`Already recorded: ${m.created_at}`);
      continue;
    }
    await client.query(
      `INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)`,
      [m.hash, m.created_at]
    );
    console.log(`Recorded migration: ${m.created_at}`);
  }

  console.log("Done. Migration journal synced.");
} finally {
  await client.end();
}
