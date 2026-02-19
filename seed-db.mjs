#!/usr/bin/env node
/**
 * Seed broker profile for Theodora Stavropoulos.
 * Listings come from Centris — run: npm run db:sync-centris
 */
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const THEODORA_HEADSHOT =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663115065429/FXvMFuJPKwMDlplc.jpeg";

async function seed() {
  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: true } });
  await client.connect();

  console.log("Seeding broker profile...");
  const brokerExists = await client.query("SELECT 1 FROM broker_profile LIMIT 1");
  if (brokerExists.rows.length === 0) {
    await client.query(
      `INSERT INTO broker_profile (name, title, agency, agency_address, phone, fax, email, bio, photo_url, languages, remax_profile_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        "Theodora Stavropoulos",
        "Residential Real Estate Broker",
        "RE/MAX 3000 Inc.",
        "9280 boul. L'Acadie, Montréal (Ahuntsic-Cartierville), QC H4N 3C5",
        "514 333-3000",
        "514 333-6376",
        "Theodora.stavropoulos@remax-quebec.com",
        "As a Residential Real Estate Broker at RE/MAX 3000 Inc., I bring dedication, market knowledge, and a personal touch to every transaction. Whether you're looking to buy, sell, or rent in Montréal, I'm here to guide you every step of the way. Fluent in English, French, and Greek.",
        THEODORA_HEADSHOT,
        JSON.stringify(["English", "French", "Greek"]),
        "https://www.remax-quebec.com/en/real-estate-brokers/theodora.stavropoulos",
      ]
    );
    console.log("Broker profile created.");
  } else {
    console.log("Broker profile already exists.");
  }

  console.log("Seed complete. Run 'npm run db:sync-centris' to import listings from Centris.ca");
  await client.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
