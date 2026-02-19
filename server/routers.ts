import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Voice AI Config (ElevenLabs + Tavus) ────────────────────
  voice: router({
    getConfig: publicProcedure.query(async () => {
      const crmUrl = process.env.NEXREL_CRM_URL;
      const websiteId = process.env.NEXREL_WEBSITE_ID;
      const secret = process.env.WEBSITE_VOICE_CONFIG_SECRET;

      if (crmUrl && websiteId && secret) {
        try {
          const res = await fetch(`${crmUrl.replace(/\/$/, "")}/api/websites/${websiteId}/voice-config`, {
            headers: { "x-website-secret": secret },
          });
          if (res.ok) {
            const data = (await res.json()) as { agentId?: string; enableVoiceAI?: boolean; enableTavusAvatar?: boolean };
            return {
              enableVoiceAI: data.enableVoiceAI ?? false,
              enableTavusAvatar: data.enableTavusAvatar ?? true,
              elevenLabsAgentId: data.agentId || null,
              websiteId: websiteId || null,
              crmUrl: crmUrl?.replace(/\/$/, "") || null,
            };
          }
        } catch (err) {
          console.warn("[voice.getConfig] CRM fetch failed:", err);
        }
      }

      return {
        enableVoiceAI: process.env.NEXREL_ENABLE_VOICE_AI === "true",
        enableTavusAvatar: process.env.NEXREL_ENABLE_TAVUS_AVATAR !== "false",
        elevenLabsAgentId: process.env.NEXREL_ELEVENLABS_AGENT_ID || null,
        websiteId: process.env.NEXREL_WEBSITE_ID || null,
        crmUrl: process.env.NEXREL_CRM_URL?.replace(/\/$/, "") || null,
      };
    }),
  }),

  // ─── Voice AI Config (from CRM or env) ───────────────────────
  voiceConfig: router({
    get: publicProcedure.query(async () => {
      const crmUrl = process.env.NEXREL_CRM_URL;
      const websiteId = process.env.NEXREL_WEBSITE_ID;
      const secret = process.env.WEBSITE_VOICE_CONFIG_SECRET;
      if (crmUrl && websiteId) {
        try {
          const res = await fetch(`${crmUrl.replace(/\/$/, "")}/api/websites/${websiteId}/voice-config`, {
            headers: secret ? { "x-website-secret": secret } : {},
          });
          if (res.ok) {
            const data = (await res.json()) as { agentId?: string; enableVoiceAI?: boolean; enableTavusAvatar?: boolean; websiteId?: string; customPrompt?: string | null };
            const tavusEnv = !!(process.env.TAVUS_API_KEY && process.env.TAVUS_REPLICA_ID && process.env.TAVUS_PERSONA_ID);
            return {
              enableVoiceAI: data.enableVoiceAI ?? false,
              enableTavusAvatar: (data.enableTavusAvatar ?? true) && tavusEnv,
              elevenLabsAgentId: data.agentId || null,
              websiteId: data.websiteId || websiteId,
              customPrompt: data.customPrompt || null,
            };
          }
        } catch (e) {
          console.warn("[voiceConfig] CRM fetch failed:", e);
        }
      }
      const tavusEnv = !!(process.env.TAVUS_API_KEY && process.env.TAVUS_REPLICA_ID && process.env.TAVUS_PERSONA_ID);
      const enableTavusFromEnv = process.env.NEXREL_ENABLE_TAVUS_AVATAR !== "false";
      return {
        enableVoiceAI: !!process.env.NEXREL_ELEVENLABS_AGENT_ID,
        enableTavusAvatar: tavusEnv && enableTavusFromEnv,
        elevenLabsAgentId: process.env.NEXREL_ELEVENLABS_AGENT_ID || null,
        websiteId: websiteId || null,
        customPrompt: null,
      };
    }),
  }),

  // ─── Agency Config (from CRM or defaults) ─────────────────────
  agencyConfig: router({
    get: publicProcedure.query(async () => {
      const crmUrl = process.env.NEXREL_CRM_URL;
      const websiteId = process.env.NEXREL_WEBSITE_ID;
      const secret = process.env.WEBSITE_VOICE_CONFIG_SECRET;
      if (crmUrl && websiteId) {
        try {
          const res = await fetch(`${crmUrl.replace(/\/$/, "")}/api/websites/${websiteId}/agency-config`, {
            headers: secret ? { "x-website-secret": secret } : {},
          });
          if (res.ok) {
            const data = (await res.json()) as Record<string, unknown>;
            const nav = data.navConfig as Record<string, unknown> | undefined;
            const labels = data.pageLabels as Record<string, string> | undefined;
            return {
              brokerName: data.brokerName ?? "Real Estate Professional",
              name: data.name ?? "Your Agency",
              logoUrl: data.logoUrl ?? "/placeholder-logo.svg",
              mapsScriptUrl: (data.mapsScriptUrl as string) || null,
              tagline: data.tagline ?? "Your trusted real estate partner",
              address: data.address ?? "",
              neighborhood: data.neighborhood ?? "",
              city: data.city ?? "",
              province: data.province ?? "",
              postalCode: data.postalCode ?? "",
              fullAddress: data.fullAddress ?? "",
              phone: data.phone ?? "",
              fax: data.fax ?? "",
              email: data.email ?? "",
              languages: Array.isArray(data.languages) ? data.languages : ["English"],
              remaxProfileUrl: data.remaxProfileUrl ?? "",
              tranquilliT: data.tranquilliT === true,
              tranquilliTUrl: data.tranquilliTUrl ?? "",
              fullAgencyMode: data.fullAgencyMode !== false,
              navConfig: nav && Object.keys(nav).length > 0 ? nav : undefined,
              pageLabels: labels && Object.keys(labels).length > 0 ? labels : undefined,
            };
          }
        } catch (e) {
          console.warn("[agencyConfig] CRM fetch failed:", e);
        }
      }
      return null; // Use template defaults
    }),
  }),

  // ─── Tavus AI Avatar (CVI) ──────────────────────────────────
  tavus: router({
    isConfigured: publicProcedure.query(() => ({
      enabled: !!(process.env.TAVUS_API_KEY && process.env.TAVUS_REPLICA_ID && process.env.TAVUS_PERSONA_ID),
    })),

    createConversation: publicProcedure.mutation(async () => {
      const apiKey = process.env.TAVUS_API_KEY;
      const replicaId = process.env.TAVUS_REPLICA_ID;
      const personaId = process.env.TAVUS_PERSONA_ID;
      if (!apiKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Tavus not configured: set TAVUS_API_KEY" });
      if (!replicaId || !personaId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Tavus not configured: set TAVUS_REPLICA_ID and TAVUS_PERSONA_ID" });

      const callbackUrl = process.env.TAVUS_CALLBACK_URL;
      const body: Record<string, string> = { replica_id: replicaId, persona_id: personaId };
      if (callbackUrl) body.callback_url = callbackUrl;

      const res = await fetch("https://tavusapi.com/v2/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("[Tavus createConversation]", res.status, err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create Tavus conversation" });
      }
      const data = (await res.json()) as { conversation_url?: string };
      if (!data.conversation_url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No conversation URL from Tavus" });
      return { conversationUrl: data.conversation_url };
    }),
  }),

  // ─── Broker Profile ────────────────────────────────────────
  broker: router({
    getProfile: publicProcedure.query(async () => {
      return db.getBrokerProfile();
    }),
  }),

  // ─── Properties ────────────────────────────────────────────
  properties: router({
    list: publicProcedure
      .input(
        z.object({
          listingType: z.enum(["sale", "rent"]).optional(),
          propertyType: z.string().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          city: z.string().optional(),
          search: z.string().optional(),
          status: z.enum(["active", "sold", "rented", "pending", "expired"]).optional(),
          featured: z.boolean().optional(),
          prestige: z.boolean().optional(),
          secret: z.boolean().optional(),
          limit: z.number().min(1).max(50).optional(),
          offset: z.number().min(0).optional(),
          sortBy: z.enum(["price_asc", "price_desc", "newest", "oldest"]).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return db.getProperties(input || {});
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const property = await db.getPropertyBySlug(input.slug);
        if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
        return property;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
        return property;
      }),

    featured: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(10).optional() }).optional())
      .query(async ({ input }) => {
        return db.getFeaturedProperties(input?.limit || 4);
      }),

    locations: publicProcedure.query(async () => {
      return db.getAllPropertyLocations();
    }),
  }),

  // ─── Inquiries ─────────────────────────────────────────────
  inquiries: router({
    submit: publicProcedure
      .input(
        z.object({
          propertyId: z.number().optional(),
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Valid email is required"),
          phone: z.string().optional(),
          message: z.string().min(1, "Message is required"),
        })
      )
      .mutation(async ({ input }) => {
        const inquiry = await db.createInquiry({
          propertyId: input.propertyId || null,
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          message: input.message,
        });
        return { success: true, id: inquiry.id };
      }),

    // Admin: list inquiries
    list: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return db.getInquiries(input || {});
      }),

    // Admin: update inquiry status
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "read", "replied", "archived"]),
        })
      )
      .mutation(async ({ input }) => {
        return db.updateInquiryStatus(input.id, input.status);
      }),
  }),

  // ─── Team ──────────────────────────────────────────────────
  team: router({
    list: publicProcedure.query(async () => db.getTeamMembers()),
  }),

  // ─── Careers ────────────────────────────────────────────────
  careers: router({
    list: publicProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => db.getCareers(input?.activeOnly ?? true)),
  }),

  // ─── Testimonials ──────────────────────────────────────────
  testimonials: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => db.getTestimonials(input?.limit)),
  }),

  // ─── Secret Properties ────────────────────────────────────
  secretSignup: router({
    submit: publicProcedure
      .input(z.object({ email: z.string().email(), name: z.string().optional() }))
      .mutation(async ({ input }) => {
        await db.createSecretSignup(input.email, input.name);
        return { success: true };
      }),
  }),

  // Reports for Secret Properties page (from CRM)
  secretReports: router({
    list: publicProcedure.query(async () => {
      const crmUrl = process.env.NEXREL_CRM_URL;
      const websiteId = process.env.NEXREL_WEBSITE_ID;
      const secret = process.env.WEBSITE_VOICE_CONFIG_SECRET;
      if (!crmUrl || !websiteId || !secret) {
        return { reports: [] };
      }
      try {
        const res = await fetch(`${crmUrl.replace(/\/$/, "")}/api/websites/${websiteId}/secret-reports`, {
          headers: { "x-website-secret": secret },
        });
        if (!res.ok) return { reports: [] };
        const data = (await res.json()) as { reports?: unknown[] };
        return { reports: data.reports ?? [] };
      } catch (e) {
        console.warn("[secretReports.list] CRM fetch failed:", e);
        return { reports: [] };
      }
    }),
  }),

  // ─── Saved Properties ──────────────────────────────────────
  saved: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getSavedProperties(ctx.user.id);
    }),

    toggle: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.toggleSavedProperty(ctx.user.id, input.propertyId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
