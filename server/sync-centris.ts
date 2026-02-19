/**
 * Centris listings sync — fetch from Apify, import to DB.
 * Used by cron API route and CLI script.
 */
import pg from "pg";
import { ApifyClient } from "apify-client";

const CENTRIS_URLS = [
  "https://www.centris.ca/en/properties~for-sale~montreal-island",
  "https://www.centris.ca/en/for-rent~montreal",
  "https://www.centris.ca/en/condos-apartments~for-rent~montreal-island",
  "https://www.centris.ca/en/houses~for-sale~montreal-island",
  "https://www.centris.ca/fr/propriete~a-vendre~berthierville?uc=0",
];

function parsePrice(priceStr: string | undefined): number | null {
  if (!priceStr || typeof priceStr !== "string") return null;
  const num = priceStr.replace(/[^0-9]/g, "");
  return num ? parseInt(num, 10) : null;
}

function mapApifyItemToProperty(item: Record<string, unknown>): Record<string, unknown> | null {
  const mls = String(item.id || "").trim();
  if (!mls) return null;

  const title = (item.title as string) || `Property ${mls}`;
  const slug = `centris-${mls}`;
  const priceNum = parsePrice(item.price as string);
  const category = (item.category as string) || "";
  const fromUrl = (item.from_url as string) || "";
  const listingType =
    category.toLowerCase().includes("rent") || fromUrl.includes("rent") ? "rent" : "sale";
  const priceLabel = listingType === "rent" ? "mo" : "";

  let city = "Montréal";
  let neighborhood: string | null = null;
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

  const detail = item.detail as Record<string, string> | undefined;
  const beds = detail?.bed ? parseInt(detail.bed, 10) : null;
  const baths = detail?.bath ? parseFloat(detail.bath) : null;

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

export async function runSyncCentris(maxPerUrl = 25): Promise<{ imported: number; error?: string }> {
  const DATABASE_URL = process.env.DATABASE_URL;
  const APIFY_TOKEN = process.env.APIFY_TOKEN;

  if (!DATABASE_URL) return { imported: 0, error: "DATABASE_URL not configured" };
  if (!APIFY_TOKEN) return { imported: 0, error: "APIFY_TOKEN not configured" };

  const client = new ApifyClient({ token: APIFY_TOKEN });
  const input = {
    urls: CENTRIS_URLS,
    max_items_per_url: maxPerUrl,
    max_retries_per_url: 2,
    proxy: { useApifyProxy: true, apifyProxyCountry: "CA" },
  };

  const run = await client.actor("ecomscrape/centris-property-search-scraper").call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const properties = items.map((item: Record<string, unknown>) => mapApifyItemToProperty(item)).filter(Boolean);
  if (properties.length === 0) return { imported: 0 };

  const cols = [
    "mls_number", "title", "slug", "property_type", "listing_type", "status", "price", "price_label",
    "address", "neighborhood", "city", "province", "bedrooms", "bathrooms", "area", "area_unit",
    "description", "main_image_url", "gallery_images", "is_featured", "room_details", "original_url",
  ];
  const updateCols = cols.filter((c) => c !== "mls_number");
  const updateSet = updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(", ");

  const pgClient = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: true } });
  await pgClient.connect();

  let count = 0;
  for (const p of properties) {
    const vals = [
      p!.mls_number,
      p!.title,
      p!.slug,
      p!.property_type,
      p!.listing_type,
      p!.status,
      p!.price,
      p!.price_label,
      p!.address,
      p!.neighborhood,
      p!.city,
      p!.province,
      p!.bedrooms,
      p!.bathrooms,
      p!.area,
      p!.area_unit,
      p!.description,
      p!.main_image_url,
      JSON.stringify(p!.gallery_images),
      p!.is_featured,
      p!.room_details ? JSON.stringify(p!.room_details) : null,
      p!.original_url,
    ];
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    await pgClient.query(
      `INSERT INTO properties (${cols.join(", ")}) VALUES (${placeholders})
       ON CONFLICT (mls_number) DO UPDATE SET ${updateSet}`,
      vals
    );
    count++;
  }

  await pgClient.end();
  return { imported: count };
}
