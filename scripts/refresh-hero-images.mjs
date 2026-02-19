#!/usr/bin/env node
/**
 * Refresh hero background images for Theodora's site.
 * Run weekly via cron: 0 0 * * 0 (Sundays midnight)
 *
 * Fetches fresh luxury interior images from Unsplash.
 * Requires UNSPLASH_ACCESS_KEY in .env (get from https://unsplash.com/developers)
 *
 * Usage: node scripts/refresh-hero-images.mjs
 * Output: New HERO_INTERIORS URLs to paste into client/src/pages/Home.tsx
 */
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

async function fetchHeroImages() {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log("Set UNSPLASH_ACCESS_KEY in .env (https://unsplash.com/developers)");
    console.log("Or use these curated IDs (paste into Home.tsx HERO_INTERIORS):");
    const ids = [
      "1600596542815-ffad4c1539a9",
      "1600585154340-be6161a56a0c",
      "1600607687939-ce8a6c25118c",
      "1600566753190-17f0baa2a6c3",
      "1600607687644-c7171b42498f",
      "1600047509807-ba8f99d2cdde",
      "1600210492486-724fe5c67fb0",
      "1600566753086-00f18fb6b3ea",
      "1600585154526-990dced4db0d",
    ];
    ids.forEach((id) => {
      console.log(`  "https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80",`);
    });
    return;
  }

  const query = "luxury interior real estate";
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=9&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
  );
  const data = await res.json();
  if (data.errors) {
    console.error("Unsplash API error:", data.errors);
    return;
  }
  const urls = (data.results || []).map(
    (p) => `${p.urls.raw}?auto=format&fit=crop&w=1200&q=80`
  );
  console.log("// Paste into Home.tsx HERO_INTERIORS:");
  urls.forEach((u) => console.log(`  "${u}",`));
}

fetchHeroImages().catch(console.error);
