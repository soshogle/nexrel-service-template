import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleTavusWebhook } from "../tavus-webhook";
import * as db from "../db";

/**
 * Creates the Express app with all API routes and middleware.
 * Does NOT include static serving or Vite - that's added by the entry point.
 */
export function createApp() {
  const app = express();

  // Vercel single handler: route passes original path as ?__path=... Restore it for Express routing.
  if (process.env.VERCEL) {
    app.use((req, _res, next) => {
      try {
        const pathParam = req.query?.__path;
        const pathStr = Array.isArray(pathParam) ? pathParam[0] : pathParam;
        if (pathStr != null && typeof pathStr === "string") {
          const q = { ...req.query } as Record<string, string>;
          delete q.__path;
          const qs = new URLSearchParams(q).toString();
          req.url = (pathStr ? "/" + pathStr : "/") + (qs ? "?" + qs : "");
        }
      } catch (err) {
        console.error("[Vercel path middleware]", err);
      }
      next();
    });
  }

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Health check for debugging
  app.get("/api/health", (_req, res) => {
    res.set("Content-Type", "text/plain").send("OK");
  });

  // REST endpoint for Voice AI client tools — search listings
  app.get("/api/listings", async (req, res) => {
    try {
      const bedrooms = req.query.bedrooms ? parseInt(String(req.query.bedrooms), 10) : undefined;
      const bathroomsParam = req.query.bathrooms ? parseInt(String(req.query.bathrooms), 10) : undefined;
      const minPrice = req.query.min_price ? parseInt(String(req.query.min_price), 10) : undefined;
      const maxPrice = req.query.max_price ? parseInt(String(req.query.max_price), 10) : undefined;
      const city = (req.query.city as string) || undefined;
      const search = (req.query.search as string) || undefined;
      const propertyType = (req.query.property_type as string) || undefined;
      const listingType = (req.query.listing_type as string) || undefined;
      const result = await db.getProperties({
        bedrooms: Number.isNaN(bedrooms!) ? undefined : bedrooms,
        bathrooms: Number.isNaN(bathroomsParam!) ? undefined : bathroomsParam,
        minPrice: Number.isNaN(minPrice!) ? undefined : minPrice,
        maxPrice: Number.isNaN(maxPrice!) ? undefined : maxPrice,
        city,
        search,
        propertyType: propertyType && ["condo", "house", "apartment", "townhouse"].includes(propertyType) ? propertyType : undefined,
        listingType: listingType === "sale" || listingType === "rent" ? listingType : undefined,
        limit: 20,
      });
      res.json(result);
    } catch (err) {
      console.error("[api/listings]", err);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // REST endpoint for Voice AI — get single listing by slug
  app.get("/api/listings/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const property = await db.getPropertyBySlug(slug);
      if (!property) {
        res.status(404).json({ error: "Property not found" });
        return;
      }
      res.json(property);
    } catch (err) {
      console.error("[api/listings/:slug]", err);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  // Debug: check if Tavus env vars are available (safe — no secrets exposed)
  app.get("/api/debug/tavus", (_req, res) => {
    const hasApiKey = !!process.env.TAVUS_API_KEY;
    const hasReplicaId = !!process.env.TAVUS_REPLICA_ID;
    const hasPersonaId = !!process.env.TAVUS_PERSONA_ID;
    res.json({
      configured: hasApiKey && hasReplicaId && hasPersonaId,
      hasApiKey,
      hasReplicaId,
      hasPersonaId,
    });
  });

  // Debug: verify listings DB + CRM config (safe — no secrets)
  app.get("/api/debug/listings", async (_req, res) => {
    const hasDbUrl = !!process.env.DATABASE_URL;
    const hasCrmUrl = !!process.env.NEXREL_CRM_URL;
    const hasWebsiteId = !!process.env.NEXREL_WEBSITE_ID;
    const hasSecret = !!process.env.WEBSITE_VOICE_CONFIG_SECRET;
    let count = 0;
    let featuredCount = 0;
    let firstMlsNumber: string | null = null;
    let error: string | null = null;
    let agencyConfigOk = false;
    try {
      const { getProperties } = await import("../db");
      const { getFeaturedProperties } = await import("../db");
      const result = await getProperties({ limit: 1 });
      count = result.total;
      const featured = await getFeaturedProperties(4);
      featuredCount = featured.length;
      if (featured.length > 0 && featured[0].mlsNumber) {
        firstMlsNumber = featured[0].mlsNumber;
      }
    } catch (e) {
      error = (e as Error)?.message ?? "Unknown error";
    }
    // Check if agency config fetch works (no secrets in response)
    if (hasCrmUrl && hasWebsiteId) {
      try {
        const crmUrl = process.env.NEXREL_CRM_URL!.replace(/\/$/, "");
        const websiteId = process.env.NEXREL_WEBSITE_ID!;
        const secret = process.env.WEBSITE_VOICE_CONFIG_SECRET;
        const headers: Record<string, string> = secret ? { "x-website-secret": secret } : {};
        const r = await fetch(`${crmUrl}/api/websites/${websiteId}/agency-config`, { headers });
        agencyConfigOk = r.ok;
      } catch {
        agencyConfigOk = false;
      }
    }
    res.json({
      databaseConfigured: hasDbUrl,
      totalListings: count,
      featuredListings: featuredCount,
      firstMlsNumber,
      isSampleData: firstMlsNumber?.startsWith("SAMPLE-") ?? false,
      error,
      env: {
        hasNexrelCrmUrl: hasCrmUrl,
        hasNexrelWebsiteId: hasWebsiteId,
        hasWebsiteVoiceConfigSecret: hasSecret,
        agencyConfigFetched: agencyConfigOk,
      },
    });
  });

  // Tavus conversation callbacks (lead capture)
  app.post("/api/webhooks/tavus", (req, res) => {
    handleTavusWebhook(req, res).catch((err) => {
      console.error("[Tavus webhook]", err);
    });
  });

  // Website voice lead → proxy to CRM
  app.post("/api/webhooks/website-voice-lead", async (req, res) => {
    const crmUrl = process.env.NEXREL_CRM_URL;
    const secret = process.env.WEBSITE_VOICE_LEAD_SECRET;
    if (!crmUrl) {
      res.status(503).json({ error: "NEXREL_CRM_URL not configured" });
      return;
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (secret) headers["x-website-voice-secret"] = secret;
      const proxyRes = await fetch(`${crmUrl.replace(/\/$/, "")}/api/webhooks/website-voice-lead`, {
        method: "POST",
        headers,
        body: JSON.stringify(req.body),
      });
      const data = await proxyRes.json().catch(() => ({}));
      res.status(proxyRes.status).json(data);
    } catch (err) {
      console.error("[website-voice-lead proxy]", err);
      res.status(502).json({ error: "Failed to push lead" });
    }
  });

  // Secret reports unlock → proxy to CRM (creates lead, returns full report)
  app.post("/api/secret-reports/unlock", express.json(), async (req, res) => {
    const crmUrl = process.env.NEXREL_CRM_URL;
    const websiteId = process.env.NEXREL_WEBSITE_ID;
    const secret = process.env.WEBSITE_VOICE_CONFIG_SECRET;
    if (!crmUrl || !websiteId) {
      res.status(503).json({ error: "CRM not configured" });
      return;
    }
    try {
      const resp = await fetch(`${crmUrl.replace(/\/$/, "")}/api/websites/${websiteId}/secret-reports/unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "x-website-secret": secret } : {}),
        },
        body: JSON.stringify(req.body || {}),
      });
      const data = await resp.json();
      res.status(resp.ok ? 200 : resp.status).json(data);
    } catch (err) {
      console.error("[secret-reports/unlock proxy]", err);
      res.status(502).json({ error: "Failed to unlock report" });
    }
  });

  // Secret reports unlock → proxy to CRM (creates lead, returns full report)
  app.post("/api/secret-reports/unlock", express.json(), async (req, res) => {
    const crmUrl = process.env.NEXREL_CRM_URL;
    const websiteId = process.env.NEXREL_WEBSITE_ID;
    const secret = process.env.WEBSITE_VOICE_CONFIG_SECRET;
    if (!crmUrl || !websiteId) {
      res.status(503).json({ error: "CRM not configured" });
      return;
    }
    try {
      const resp = await fetch(`${crmUrl.replace(/\/$/, "")}/api/websites/${websiteId}/secret-reports/unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "x-website-secret": secret } : {}),
        },
        body: JSON.stringify(req.body || {}),
      });
      const data = await resp.json();
      res.status(resp.ok ? 200 : resp.status).json(data);
    } catch (err) {
      console.error("[secret-reports/unlock proxy]", err);
      res.status(502).json({ error: "Failed to unlock report" });
    }
  });

  // Property evaluation → proxy to CRM (client sends here; server forwards with secret)
  app.post("/api/property-evaluation", express.json(), async (req, res) => {
    const crmUrl = process.env.NEXREL_CRM_URL;
    const websiteId = process.env.NEXREL_WEBSITE_ID;
    const secret = process.env.WEBSITE_VOICE_CONFIG_SECRET;
    if (!crmUrl || !websiteId) {
      res.status(503).json({ error: "CRM not configured" });
      return;
    }
    try {
      const resp = await fetch(`${crmUrl.replace(/\/$/, "")}/api/websites/${websiteId}/property-evaluation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "x-website-secret": secret } : {}),
        },
        body: JSON.stringify(req.body || {}),
      });
      const data = await resp.json();
      res.status(resp.ok ? 200 : resp.status).json(data);
    } catch (err) {
      console.error("[property-evaluation proxy]", err);
      res.status(502).json({ error: "Failed to run evaluation" });
    }
  });

  // Voice AI lead push (client sends here; server forwards to CRM with secret)
  app.post("/api/voice/push-lead", express.json(), async (req, res) => {
    const crmUrl = process.env.NEXREL_CRM_URL;
    const websiteId = process.env.NEXREL_WEBSITE_ID;
    const secret = process.env.WEBSITE_VOICE_LEAD_SECRET;
    if (!crmUrl || !websiteId) {
      res.status(503).json({ error: "CRM not configured" });
      return;
    }
    const { name, email, phone, transcript, notes, source } = req.body || {};
    if (!name && !email && !phone) {
      res.status(400).json({ error: "At least name, email, or phone required" });
      return;
    }
    try {
      const resp = await fetch(`${crmUrl.replace(/\/$/, "")}/api/webhooks/website-voice-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "x-website-voice-secret": secret } : {}),
        },
        body: JSON.stringify({
          websiteId,
          name: name || "Voice AI Visitor",
          email: email || undefined,
          phone: phone || undefined,
          transcript: transcript || "",
          notes: notes || undefined,
          source: source || undefined,
        }),
      });
      const data = await resp.json();
      res.status(resp.ok ? 200 : resp.status).json(data);
    } catch (err) {
      console.error("[voice/push-lead]", err);
      res.status(502).json({ error: "Failed to push lead" });
    }
  });

  // ElevenLabs signed URL proxy (template calls CRM; keeps API key server-side)
  // Forwards dynamic variables (page_context, selected_listing, etc.) for voice AI context
  app.get("/api/voice/signed-url", async (req, res) => {
    const agentId = req.query.agentId as string;
    const crmUrl = process.env.NEXREL_CRM_URL;
    const secret = process.env.WEBSITE_VOICE_CONFIG_SECRET;
    if (!agentId || !crmUrl) {
      res.status(400).json({ error: "agentId required; NEXREL_CRM_URL not configured" });
      return;
    }
    try {
      const qs = new URLSearchParams(req.query as Record<string, string>).toString();
      const url = `${crmUrl.replace(/\/$/, "")}/api/elevenlabs/signed-url?${qs}`;
      const headers: Record<string, string> = {};
      if (secret) headers["x-website-secret"] = secret;
      const resp = await fetch(url, { headers });
      const data = await resp.json();
      if (!resp.ok) {
        res.status(resp.status).json(data);
        return;
      }
      res.json(data);
    } catch (err) {
      console.error("[voice/signed-url]", err);
      res.status(502).json({ error: "Failed to get signed URL" });
    }
  });

  // Google Maps script proxy - keeps API key on server, works for all domains
  app.get("/api/maps/js", async (req, res) => {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      res.status(503).json({ error: "Maps not configured: set GOOGLE_MAPS_API_KEY" });
      return;
    }
    const v = req.query.v || "weekly";
    const libraries = req.query.libraries || "marker,places,geocoding,geometry";
    const url = `https://maps.googleapis.com/maps/api/js?key=${key}&v=${v}&libraries=${libraries}`;
    try {
      const resp = await fetch(url);
      const body = await resp.text();
      res.set("Content-Type", "application/javascript");
      res.send(body);
    } catch (err) {
      console.error("[Maps proxy]", err);
      res.status(502).send("Failed to load Maps script");
    }
  });

  return app;
}
