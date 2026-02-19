#!/usr/bin/env node
/**
 * Create properties table and required enums if they don't exist.
 * Use when DB has ecommerce schema but template needs real estate properties.
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
-- Create properties table if not exist (use varchar for enum-like columns to avoid type conflicts)
CREATE TABLE IF NOT EXISTS properties (
  id serial PRIMARY KEY,
  mls_number varchar(50) NOT NULL UNIQUE,
  title varchar(500) NOT NULL,
  slug varchar(500) NOT NULL UNIQUE,
  property_type varchar(50) DEFAULT 'apartment' NOT NULL,
  listing_type varchar(50) DEFAULT 'rent' NOT NULL,
  status varchar(50) DEFAULT 'active' NOT NULL,
  price numeric(12, 2) NOT NULL,
  price_label varchar(50),
  address varchar(500) NOT NULL,
  neighborhood varchar(255),
  city varchar(255) NOT NULL,
  province varchar(100),
  postal_code varchar(20),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  bedrooms integer,
  bathrooms integer,
  rooms integer,
  area varchar(100),
  area_unit varchar(20),
  lot_area varchar(100),
  year_built integer,
  description text,
  addendum text,
  main_image_url text,
  gallery_images jsonb,
  features jsonb,
  room_details jsonb,
  is_new boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_prestige boolean DEFAULT false,
  is_secret boolean DEFAULT false,
  original_url text,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);
`;

async function main() {
  try {
    await client.connect();
    await client.query(sql);
    console.log("✅ Properties table ready");
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
