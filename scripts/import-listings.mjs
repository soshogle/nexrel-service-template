#!/usr/bin/env node
/**
 * Import listings from CSV or JSON.
 * Usage:
 *   node scripts/import-listings.mjs data.json   # Import from JSON file
 *   node scripts/import-listings.mjs data.csv    # Import from CSV file
 *
 * For Montreal listings from Centris.ca, use: npm run db:sync-centris
 */
import pg from "pg";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Set it in .env");
  process.exit(1);
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      values.push(current.replace(/^"|"$/g, "").trim());
      current = "";
    } else {
      current += c;
    }
  }
  values.push(current.replace(/^"|"$/g, "").trim());
  return values;
}

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headerVals = parseCsvLine(lines[0]);
  const headers = headerVals.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function mapCsvRowToProperty(row) {
  const mls = String(row.mls_number || row.mlsNumber || row.MLS || "").trim();
  const address = String(row.address || row.Address || "").trim();
  const title = String(row.title || row.Title || row.name || `${address}`).trim();
  if (!mls || !address) return null;
  const slug = row.slug || slugify(title || address);
  return {
    mls_number: mls,
    title: title || address,
    slug,
    property_type: (row.property_type || row.propertyType || "apartment").toLowerCase().replace(/\s/g, "_"),
    listing_type: (row.listing_type || row.listingType || row.type || "rent").toLowerCase(),
    status: (row.status || "active").toLowerCase(),
    price: String(row.price || row.Price || 0),
    price_label: row.price_label || row.priceLabel || (row.listing_type === "sale" ? "" : "mo"),
    address,
    neighborhood: row.neighborhood || row.Neighborhood || row.area || null,
    city: String(row.city || row.City || "Montréal").trim(),
    province: row.province || row.Province || "Quebec",
    bedrooms: row.bedrooms || row.beds ? parseInt(row.bedrooms || row.beds, 10) : null,
    bathrooms: row.bathrooms || row.baths ? parseFloat(row.bathrooms || row.baths) : null,
    area: row.area || row.sqft || row.sq_ft || null,
    area_unit: row.area_unit || row.areaUnit || "ft²",
    description: row.description || row.Description || "",
    main_image_url: row.main_image_url || row.mainImageUrl || row.image || row.photo || null,
    gallery_images: Array.isArray(row.gallery_images)
      ? row.gallery_images
      : typeof row.gallery_images === "string"
        ? JSON.parse(row.gallery_images || "[]")
        : [],
    room_details: Array.isArray(row.room_details) ? row.room_details : null,
    is_featured: row.is_featured === true || row.is_featured === "true" || row.isFeatured === true,
  };
}

function normalizeProperty(p) {
  const gallery = Array.isArray(p.gallery_images) ? p.gallery_images : [];
  const mainImg = p.main_image_url || (gallery[0] || null);
  return {
    mls_number: String(p.mls_number),
    title: String(p.title || p.address),
    slug: p.slug || slugify(p.title || p.address),
    property_type: (p.property_type || "apartment").toLowerCase().replace(/\s/g, "_"),
    listing_type: (p.listing_type || "rent").toLowerCase(),
    status: (p.status || "active").toLowerCase(),
    price: String(p.price),
    price_label: p.price_label ?? (p.listing_type === "sale" ? "" : "mo"),
    address: String(p.address),
    neighborhood: p.neighborhood ?? null,
    city: String(p.city || "Montréal"),
    province: p.province || "Quebec",
    bedrooms: p.bedrooms != null ? parseInt(p.bedrooms, 10) : null,
    bathrooms: p.bathrooms != null ? parseFloat(p.bathrooms) : null,
    area: p.area != null ? String(p.area) : null,
    area_unit: p.area_unit || "ft²",
    description: p.description || "",
    main_image_url: mainImg,
    gallery_images: gallery.length ? gallery : (mainImg ? [mainImg] : []),
    room_details: Array.isArray(p.room_details) ? p.room_details : null,
    is_featured: !!p.is_featured,
  };
}

async function importListings(properties) {
  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: true } });
  await client.connect();

  const cols = [
    "mls_number", "title", "slug", "property_type", "listing_type", "status", "price", "price_label",
    "address", "neighborhood", "city", "province", "bedrooms", "bathrooms", "area", "area_unit",
    "description", "main_image_url", "gallery_images", "is_featured", "room_details",
  ];
  const updateCols = cols.filter((c) => c !== "mls_number");
  const updateSet = updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(", ");

  let imported = 0;

  for (const p of properties) {
    const normalized = normalizeProperty(p);
    const vals = [
      normalized.mls_number,
      normalized.title,
      normalized.slug,
      normalized.property_type,
      normalized.listing_type,
      normalized.status,
      normalized.price,
      normalized.price_label,
      normalized.address,
      normalized.neighborhood,
      normalized.city,
      normalized.province,
      normalized.bedrooms,
      normalized.bathrooms,
      normalized.area,
      normalized.area_unit,
      normalized.description,
      normalized.main_image_url,
      JSON.stringify(normalized.gallery_images),
      normalized.is_featured,
      normalized.room_details ? JSON.stringify(normalized.room_details) : null,
    ];
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    const sql = `INSERT INTO properties (${cols.join(", ")}) VALUES (${placeholders})
      ON CONFLICT (mls_number) DO UPDATE SET ${updateSet}`;

    await client.query(sql, vals);
    imported++;
  }

  await client.end();
  return { imported };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/import-listings.mjs <file.json|file.csv>");
    console.error("For Montreal listings from Centris.ca, run: npm run db:sync-centris");
    process.exit(1);
  }

  const absPath = resolve(process.cwd(), filePath);
  console.log(`Reading from ${absPath}`);
  const content = readFileSync(absPath, "utf-8");
  const ext = filePath.toLowerCase().slice(-5);
  let properties;
  if (ext.endsWith(".json")) {
    const data = JSON.parse(content);
    properties = Array.isArray(data) ? data : data.properties || data.listings || [data];
  } else if (ext.endsWith(".csv")) {
    const rows = parseCsv(content);
    properties = rows.map(mapCsvRowToProperty).filter(Boolean);
  } else {
    console.error("Unsupported format. Use .json or .csv");
    process.exit(1);
  }
  console.log(`Parsed ${properties.length} listings.`);

  if (properties.length === 0) {
    console.error("No properties to import.");
    process.exit(1);
  }

  const { imported } = await importListings(properties);
  console.log(`Import complete. Processed ${imported} listings.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
