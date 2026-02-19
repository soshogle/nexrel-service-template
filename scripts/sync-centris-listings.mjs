#!/usr/bin/env node
/**
 * Sync Montreal/Quebec listings from Centris.ca via Apify.
 * Centris has no public API; we use Apify's Centris Property Search Scraper.
 *
 * Usage: node scripts/sync-centris-listings.mjs [maxPerUrl]
 *   maxPerUrl: max listings per search URL (default 50)
 *
 * Requires: APIFY_TOKEN in .env (get from https://console.apify.com/account/integrations)
 * Apify actor: ecomscrape/centris-property-search-scraper (~$20/mo + usage)
 */
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const APIFY_TOKEN = process.env.APIFY_TOKEN;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
if (!APIFY_TOKEN) {
  console.error("APIFY_TOKEN is required. Get from https://console.apify.com/account/integrations");
  process.exit(1);
}

// Centris search URLs (Montreal + Berthierville)
const CENTRIS_URLS = [
  "https://www.centris.ca/en/properties~for-sale~montreal-island",
  "https://www.centris.ca/en/for-rent~montreal",
  "https://www.centris.ca/en/condos-apartments~for-rent~montreal-island",
  "https://www.centris.ca/en/houses~for-sale~montreal-island",
  "https://www.centris.ca/fr/propriete~a-vendre~berthierville?uc=0",
];

function parsePrice(priceStr) {
  if (!priceStr || typeof priceStr !== "string") return null;
  const num = priceStr.replace(/[^0-9]/g, "");
  return num ? parseInt(num, 10) : null;
}

function mapApifyItemToProperty(item) {
  const mls = String(item.id || "").trim();
  if (!mls) return null;

  const title = item.title || `Property ${mls}`;
  const slug = `centris-${mls}`;
  const priceNum = parsePrice(item.price);
  const listingType = (item.category || "").toLowerCase().includes("rent") || (item.from_url || "").includes("rent")
    ? "rent"
    : "sale";
  const priceLabel = listingType === "rent" ? "mo" : "";

  // Extract city/neighborhood from title or category
  const category = item.category || "";
  let city = "Montréal";
  let neighborhood = null;
  const titleMatch = title.match(/(?:à|in|at)\s+([^,]+)/i);
  if (titleMatch) {
    const loc = titleMatch[1].trim();
    if (loc.includes("Montreal") || loc.includes("Montréal")) {
      city = "Montréal";
      neighborhood = loc.replace(/Montreal( Island)?/i, "").trim() || null;
    } else {
      city = loc;
    }
  }

  const beds = item.detail?.bed ? parseInt(item.detail.bed, 10) : null;
  const baths = item.detail?.bath ? parseFloat(item.detail.bath) : null;

  return {
    mls_number: mls,
    title: title.slice(0, 500),
    slug: slug.slice(0, 500),
    property_type: category.toLowerCase().includes("condo") || category.toLowerCase().includes("apartment")
      ? "condo"
      : category.toLowerCase().includes("house") || category.toLowerCase().includes("maison")
        ? "house"
        : "apartment",
    listing_type: listingType,
    status: "active",
    price: String(priceNum || 0),
    price_label: priceLabel,
    address: title.slice(0, 500),
    neighborhood,
    city,
    province: "Quebec",
    bedrooms: beds,
    bathrooms: baths,
    area: null,
    area_unit: "ft²",
    description: category || "",
    main_image_url: item.image || null,
    gallery_images: item.image ? [item.image] : [],
    room_details: null,
    is_featured: false,
    original_url: item.url || `https://www.centris.ca/en/property/${mls}`,
  };
}

async function fetchFromApify(maxPerUrl = 50) {
  const { ApifyClient } = await import("apify-client");
  const client = new ApifyClient({ token: APIFY_TOKEN });

  const input = {
    urls: CENTRIS_URLS,
    max_items_per_url: maxPerUrl,
    max_retries_per_url: 2,
    proxy: { useApifyProxy: true, apifyProxyCountry: "CA" },
  };

  console.log("Running Apify Centris scraper...");
  const run = await client.actor("ecomscrape/centris-property-search-scraper").call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items;
}

async function importToDb(properties) {
  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: true } });
  await client.connect();

  const cols = [
    "mls_number", "title", "slug", "property_type", "listing_type", "status", "price", "price_label",
    "address", "neighborhood", "city", "province", "bedrooms", "bathrooms", "area", "area_unit",
    "description", "main_image_url", "gallery_images", "is_featured", "room_details", "original_url",
  ];
  const updateCols = cols.filter((c) => c !== "mls_number");
  const updateSet = updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(", ");

  let count = 0;
  for (const p of properties) {
    const vals = [
      p.mls_number,
      p.title,
      p.slug,
      p.property_type,
      p.listing_type,
      p.status,
      p.price,
      p.price_label,
      p.address,
      p.neighborhood,
      p.city,
      p.province,
      p.bedrooms,
      p.bathrooms,
      p.area,
      p.area_unit,
      p.description,
      p.main_image_url,
      JSON.stringify(p.gallery_images),
      p.is_featured,
      p.room_details ? JSON.stringify(p.room_details) : null,
      p.original_url,
    ];
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    await client.query(
      `INSERT INTO properties (${cols.join(", ")}) VALUES (${placeholders})
       ON CONFLICT (mls_number) DO UPDATE SET ${updateSet}`,
      vals
    );
    count++;
  }

  await client.end();
  return count;
}

async function main() {
  const maxPerUrl = parseInt(process.argv[2] || "50", 10);

  const items = await fetchFromApify(maxPerUrl);
  console.log(`Fetched ${items.length} listings from Centris.`);

  const properties = items.map(mapApifyItemToProperty).filter(Boolean);
  if (properties.length === 0) {
    console.log("No valid properties to import.");
    return;
  }

  const count = await importToDb(properties);
  console.log(`Imported ${count} listings to database.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
