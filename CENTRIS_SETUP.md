# Centris.ca Listings Setup

Listings for Theodora's site come from **Centris.ca** — Quebec's largest real estate platform (63,000+ properties).

## Centris Has No Public API

Centris does not offer a public REST API. Brokers typically receive data via:
- **FTP** — Authorized brokerages get listing files from Centris
- **Broker portal** — zone.centris.ca for managing listings (no API access)

## Our Approach: Apify

We use [Apify's Centris Property Search Scraper](https://apify.com/ecomscrape/centris-property-search-scraper) to fetch Montreal listings. This is a third-party service that extracts public listing data from Centris.ca.

### Setup

1. **Create an Apify account** — [apify.com](https://apify.com)
2. **Get your API token** — [console.apify.com/account/integrations](https://console.apify.com/account/integrations)
3. **Add to .env:**
   ```
   APIFY_TOKEN=apify_api_xxxxxxxxxxxx
   ```
4. **Run the sync:**
   ```bash
   npm run db:sync-centris
   ```
   Optionally limit per URL: `node scripts/sync-centris-listings.mjs 30`

### Central Sync (nexrel-crm)

For multi-owner deployments, the sync runs from **nexrel-crm** once per day. It fetches from Apify once and writes to all broker databases. See `nexrel-crm/docs/CENTRIS_SYNC.md`.

**Broker sites:** Add your `DATABASE_URL` to `CENTRIS_REALTOR_DATABASE_URLS` in nexrel-crm's Vercel env vars. No APIFY_TOKEN or cron needed on your site.

### Manual Sync (standalone)

For a single standalone site: `npm run db:sync-centris` (requires `APIFY_TOKEN` in .env).

### Cost

- Apify actor: ~$20/month + usage
- Fetches Montreal Island listings (sale + rent, condos, houses)

### Sync URLs

The script fetches from:
- Properties for sale — Montreal Island
- For rent — Montreal
- Condos/Apartments for rent — Montreal Island
- Houses for sale — Montreal Island

## Alternative: Centris FTP

If RE/MAX 3000 Inc. has Centris FTP access, you could build a custom sync that reads listing files directly. Contact Centris support (514-762-5264) to inquire about FTP data distribution for your brokerage.

## Search for Buyers

When a potential buyer asks about a specific property type or criteria, the site's Properties page supports:
- Search by text (address, neighborhood, city)
- Filter by listing type (sale/rent), bedrooms, price range, property type
- Results are from the synced Centris listings
