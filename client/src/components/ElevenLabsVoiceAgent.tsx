/**
 * ElevenLabs Voice AI — same look as nexrel.soshogle.com landing page.
 * Frameless: cyan/purple waves (GeometricShapes) + microphone button.
 * No frame, no box — just waves and mic, exactly like the landing page.
 *
 * Uses signed URL from /api/voice/signed-url (proxies to CRM).
 * Client tools: searchListings, showListing, getListingDetails.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Conversation } from "@elevenlabs/client";
import { GeometricShapes } from "./GeometricShapes";
import { usePageContextOptional } from "@/contexts/PageContext";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";
import { getEasternTimeContext } from "@/lib/voice-time-context";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
const NAME_PATTERNS = [
  /(?:my name is|i'm|i am|call me|this is)\s+([A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s-]{2,50})/i,
  /(?:name is|named)\s+([A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s-]{2,50})/i,
];

function extractFromTranscript(messages: { role: string; content: string }[]) {
  const text = messages.map((m) => m.content).join(" ");
  const result: { name?: string; email?: string; phone?: string } = {};
  const emails = text.match(EMAIL_REGEX);
  if (emails?.length) {
    const real = emails.find((e) => !e.includes("example") && !e.includes("test"));
    result.email = (real || emails[0]).trim();
  }
  const phones = text.match(PHONE_REGEX);
  if (phones?.length) result.phone = phones[0].replace(/\s/g, "").trim();
  for (const p of NAME_PATTERNS) {
    const m = text.match(p);
    if (m && m[1].length >= 2 && m[1].length <= 50) {
      result.name = m[1].trim();
      break;
    }
  }
  return result;
}

function transcriptToSummary(messages: { role: string; content: string }[]) {
  return messages
    .slice(0, 20)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n");
}

function buildPageContextJson(pageCtx: {
  path: string;
  pageType: string;
  visibleListings: any[];
  selectedListing: any;
  searchAddress?: string | null;
}) {
  const visible = (pageCtx.visibleListings || []).slice(0, 10).map((p) => ({
    slug: p.slug,
    title: p.title,
    address: p.address,
    city: p.city,
    price: p.price,
    bedrooms: p.bedrooms,
    listingType: p.listingType,
  }));
  const selected = pageCtx.selectedListing
    ? {
        slug: pageCtx.selectedListing.slug,
        title: pageCtx.selectedListing.title,
        address: pageCtx.selectedListing.address,
        city: pageCtx.selectedListing.city,
        price: pageCtx.selectedListing.price,
        bedrooms: pageCtx.selectedListing.bedrooms,
        bathrooms: pageCtx.selectedListing.bathrooms,
        description: (pageCtx.selectedListing.description || "").slice(0, 500),
      }
    : null;
  return JSON.stringify({
    page: pageCtx.path,
    pageType: pageCtx.pageType,
    visibleListings: visible,
    selectedListing: selected,
    searchAddress: pageCtx.searchAddress ?? null,
  });
}

// Landing page colors: cyan #22d3ee, purple #8b5cf6
const VOICE_COLORS = {
  cyan: "#22d3ee",
  purple: "#8b5cf6",
};

interface Props {
  agentId: string;
  websiteId: string | null;
  customPrompt?: string | null;
  onConversationEnd?: (messages: { role: string; content: string }[]) => void;
}

export default function ElevenLabsVoiceAgent({ agentId, websiteId, customPrompt, onConversationEnd }: Props) {
  const config = useAgencyConfig();
  const pageCtx = usePageContextOptional();
  const [expanded, setExpanded] = useState(true); // Expanded by default — visitor sees Voice AI ready; clicks mic to start (browsers block auto getUserMedia)
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const conversationRef = useRef<any>(null);
  const messagesRef = useRef<{ role: string; content: string }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioPulseRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioConnectedRef = useRef(false);

  const buildSignedUrlParams = useCallback(() => {
    const params = new URLSearchParams({ agentId: agentId.trim() });
    if (pageCtx) {
      const ctxJson = buildPageContextJson(pageCtx);
      params.set("page_context", ctxJson);
    }
    // Eastern time (Montréal/Quebec) — shared across all agents
    const timeContext = getEasternTimeContext();
    const basePrompt = customPrompt?.trim() ?? "";
    params.set("custom_prompt", basePrompt ? `${basePrompt}\n\n${timeContext}` : timeContext);
    return params.toString();
  }, [agentId, pageCtx, customPrompt]);

  const clientTools = useCallback(() => {
    if (!pageCtx) return undefined;
    const { navigate } = pageCtx;
    return {
      searchListings: async (params: {
        bedrooms?: number;
        bathrooms?: number;
        city?: string;
        search?: string;
        listing_type?: string;
        property_type?: string;
        min_price?: number;
        max_price?: number;
      }) => {
        const q = new URLSearchParams();
        if (params.bedrooms) q.set("bedrooms", String(params.bedrooms));
        if (params.bathrooms) q.set("bathrooms", String(params.bathrooms));
        if (params.city) q.set("city", params.city);
        if (params.search) q.set("search", params.search);
        if (params.listing_type) q.set("listing_type", params.listing_type);
        if (params.property_type) q.set("property_type", params.property_type);
        if (params.min_price) q.set("min_price", String(params.min_price));
        if (params.max_price) q.set("max_price", String(params.max_price));
        const path = params.listing_type === "rent" ? "/for-lease" : "/for-sale";
        if (params.listing_type === "rent") q.set("listing_type", "rent");
        else if (params.listing_type === "sale") q.set("listing_type", "sale");
        const res = await fetch(`/api/listings?${q.toString()}`);
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error || "Failed to search"}`;
        const items = data.items || [];
        navigate(`${path}?${q.toString()}`);
        if (items.length === 0) return "No listings found matching your criteria.";
        const summary = items.slice(0, 5).map((p: any) => `${p.title} at $${parseFloat(p.price || 0).toLocaleString()}${p.priceLabel ? "/" + p.priceLabel : ""}`).join("; ");
        return `Found ${items.length} listings. Showing them on screen. Top results: ${summary}`;
      },
      showListing: async (params: { slug: string }) => {
        navigate(`/property/${params.slug}`);
        return `Showing listing ${params.slug} on screen.`;
      },
      getListingDetails: async (params: { slug: string }) => {
        const res = await fetch(`/api/listings/${encodeURIComponent(params.slug)}`);
        const p = await res.json();
        if (!res.ok || !p) return "Listing not found.";
        const price = `$${parseFloat(p.price || 0).toLocaleString()}${p.priceLabel ? "/" + p.priceLabel : ""}`;
        return `${p.title}. ${p.address}, ${p.city}. ${price}. ${p.bedrooms ? p.bedrooms + " bedrooms" : ""} ${p.bathrooms ? p.bathrooms + " bathrooms" : ""}. ${(p.description || "").slice(0, 300)}`;
      },
    };
  }, [pageCtx]);

  const CONNECTION_TIMEOUT_MS = 15000; // 15s — show error if WebSocket never connects

  const startConversation = useCallback(async () => {
    if (!agentId?.trim()) return;
    setIsLoading(true);
    setError(null);
    messagesRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      try {
        const rec = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
        rec.ondataavailable = () => {};
        rec.start(1000);
        mediaRecorderRef.current = rec;
      } catch {}

      const urlRes = await fetch(`/api/voice/signed-url?${buildSignedUrlParams()}`);
      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to connect");
      }
      const { signedUrl } = await urlRes.json();
      if (!signedUrl) throw new Error("No connection URL");

      // Create AudioContext before connection — onConnect will use it to route SDK audio
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      audioContextRef.current.resume?.().catch(() => {});

      const tools = clientTools();

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const clearTimeoutIfConnected = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      conversationRef.current = await Conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        ...(tools && { clientTools: tools }),
        // Give audio pipeline time to initialize (prevents first message being cut off / no audio)
        connectionDelay: { android: 3000, ios: 1000, default: 1000 },
        // dynamicVariables (current_datetime, etc.) are injected by CRM signed-url; pass client-side for consistency
        dynamicVariables: {
          current_datetime: new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
          current_day: new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" }),
          timezone: "America/New_York",
          current_date_time_eastern: getEasternTimeContext(),
          ...(pageCtx?.searchAddress && {
            user_searched_address: pageCtx.searchAddress,
            user_area_of_interest: pageCtx.searchAddress,
          }),
        },
        onConnect: () => {
          clearTimeoutIfConnected();
          setIsConnected(true);
          setIsLoading(false);
          // Ensure output volume is max (browser/device may default to muted)
          try {
            conversationRef.current?.setVolume?.({ volume: 1 });
          } catch {}
          // Inject Eastern time so agent knows date/time when asked
          try {
            conversationRef.current?.sendContextualUpdate?.(getEasternTimeContext());
          } catch {}
          // Connect SDK audio element to Web Audio API (must run after connection — SDK creates element then)
          // Only connect once — createMediaElementSource fails if element already connected
          const tryConnectAudio = () => {
            if (audioConnectedRef.current) return true;
            try {
              const audioElement = document.querySelector("audio");
              if (audioElement && audioContextRef.current && analyserRef.current) {
                const source = audioContextRef.current.createMediaElementSource(audioElement);
                source.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
                audioConnectedRef.current = true;
                return true;
              }
            } catch (e) {
              if (e instanceof Error && e.name === "InvalidStateError") {
                audioConnectedRef.current = true;
              } else {
                console.warn("[Voice] Audio connect:", e);
              }
            }
            return false;
          };
          const attempt = (delay: number) => {
            setTimeout(() => {
              if (tryConnectAudio()) return;
              if (delay < 2000) attempt(delay + 500);
            }, delay);
          };
          attempt(0);
          attempt(600);
          attempt(1200);
        },
        onDisconnect: () => {
          audioConnectedRef.current = false;
          setIsConnected(false);
          setIsAgentSpeaking(false);
          setAudioLevel(0);
          const msgs = messagesRef.current;
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
          streamRef.current?.getTracks().forEach((t) => t.stop());
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
          analyserRef.current = null;
          conversationRef.current = null;
          if (onConversationEnd) onConversationEnd(msgs);
          if (websiteId && msgs.length > 0) {
            const extracted = extractFromTranscript(msgs);
            if (extracted.name || extracted.email || extracted.phone) {
              fetch("/api/webhooks/website-voice-lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  websiteId,
                  name: extracted.name,
                  email: extracted.email,
                  phone: extracted.phone,
                  transcript: transcriptToSummary(msgs),
                }),
              }).catch((e) => console.warn("[Voice] CRM push failed:", e));
            }
          }
        },
        onError: (e: unknown) => {
          clearTimeoutIfConnected();
          setError((e as Error)?.message || "Connection error");
          setIsLoading(false);
        },
        onMessage: (msg: any) => {
          if (msg.message) {
            const role = msg.source === "ai" ? "agent" : "user";
            messagesRef.current.push({ role, content: msg.message });
          }
        },
        onModeChange: (mode: { mode?: string }) => {
          const speaking = mode?.mode === "speaking";
          setIsAgentSpeaking(speaking);
          if (!speaking) setAudioLevel(0);
        },
      });

      // If WebSocket never connects within 15s, show error so user isn't stuck on "Connecting"
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (conversationRef.current) {
          setError("Connection timed out. Check your connection and try again.");
          setIsLoading(false);
          try {
            conversationRef.current?.endSession?.();
          } catch {}
          conversationRef.current = null;
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
          analyserRef.current = null;
        }
      }, CONNECTION_TIMEOUT_MS);
    } catch (err: any) {
      setError(err.message || "Could not start");
      setIsLoading(false);
    }
  }, [agentId, websiteId, onConversationEnd, buildSignedUrlParams, clientTools]);

  // Simulated audio pulse when agent speaks (websocket doesn't expose audio stream)
  useEffect(() => {
    if (!isAgentSpeaking) return;
    let raf: number;
    const tick = () => {
      audioPulseRef.current += 0.08;
      const v = Math.sin(audioPulseRef.current) * 0.35 + 0.5;
      setAudioLevel(Math.max(0, Math.min(1, v)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isAgentSpeaking]);

  const stopConversation = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (conversationRef.current) {
      try {
        conversationRef.current.endSession();
      } catch {}
      conversationRef.current = null;
    }
    setIsConnected(false);
    setIsAgentSpeaking(false);
    setAudioLevel(0);
  };

  useEffect(() => () => stopConversation(), []);

  // Property Concierge / Call Now can trigger open via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ requestCallback?: boolean; propertyConcierge?: boolean }>)?.detail ?? {};
      const requestCallback = !!detail?.requestCallback;
      const propertyConcierge = !!detail?.propertyConcierge;

      setExpanded(true);

      if (isConnected && conversationRef.current?.sendContextualUpdate) {
        if (requestCallback) {
          // Already in conversation: inject callback flow — tell user Theodora will call back, collect name/email/phone
          const brokerFirst = config.brokerName.split(" ")[0] ?? "Agent";
          const update = `IMPORTANT: The user just clicked "Call Now" — they want to speak to ${brokerFirst} directly. Tell them that if they would like to speak with ${brokerFirst}, she will call them back. Ask for and collect their name, email address, and phone number if you have not already captured this information in our conversation. Be warm and helpful.`;
          conversationRef.current.sendContextualUpdate(update);
        } else if (propertyConcierge) {
          // User clicked Property Concierge: tell them you are the Property Concierge and can help
          const update = `IMPORTANT: The user just clicked "Property Concierge". Tell them that you are the Property Concierge and you can help them find what they need — whether they're looking to buy, sell, or rent. Ask how you can assist them.`;
          conversationRef.current.sendContextualUpdate(update);
        }
      } else if (!isConnected && !isLoading) {
        startConversation();
      }
    };
    window.addEventListener("openVoiceAI", handler);
    return () => window.removeEventListener("openVoiceAI", handler);
  }, [isConnected, isLoading, startConversation]);

  useEffect(() => {
    if (!pageCtx || !conversationRef.current?.sendContextualUpdate) return;
    const unreg = pageCtx.registerContextUpdater((ctx) => {
      const conv = conversationRef.current;
      if (conv?.sendContextualUpdate) {
        const json = buildPageContextJson(ctx);
        conv.sendContextualUpdate(`User is now viewing: ${json}`);
      }
    });
    return unreg;
  }, [pageCtx]);

  if (!agentId) return null;

  // Collapsed: floating mic button — same as landing page (no frame)
  if (!expanded) {
    return (
      <button
        onClick={() => {
          setExpanded(true);
          if (!isConnected && !isLoading) startConversation();
        }}
        className="fixed bottom-6 right-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-all hover:scale-110"
        style={{
          background: `rgba(139, 92, 246, 0.1)`,
          border: `2px solid rgba(34, 211, 238, 0.3)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
          e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)";
          e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.3)";
        }}
        aria-label="Talk to AI assistant"
      >
        <svg
          className="w-8 h-8 animate-pulse"
          style={{ color: VOICE_COLORS.cyan }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    );
  }

  // Expanded: frameless waves + close button — same as landing page
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <div
        className="flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-black/10"
        style={{
          width: 320,
          height: 320,
        }}
      >
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <GeometricShapes audioLevel={audioLevel} isAgentSpeaking={isAgentSpeaking} />
      </div>

      {/* Tap to start — when not connected, show mic so visitor can click to begin */}
      {!isConnected && !isLoading && !error && (
        <button
          onClick={() => startConversation()}
          className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer group"
          aria-label="Start conversation"
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full transition-transform group-hover:scale-110"
            style={{
              background: "rgba(139, 92, 246, 0.2)",
              border: "2px solid rgba(34, 211, 238, 0.4)",
            }}
          >
            <svg
              className="w-10 h-10 animate-pulse"
              style={{ color: VOICE_COLORS.cyan }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </button>
      )}

      {/* Close button — top right, always on top (z-30) so X is clickable */}
      <button
        onClick={() => {
          stopConversation();
          setExpanded(false);
        }}
        className="absolute top-3 right-3 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors z-30"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-white" />
      </button>

      {/* Loading overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl z-10">
          <p className="text-sm font-medium text-white/90">Connecting...</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 rounded-2xl z-10 p-4">
          <p className="text-center text-sm text-white">{error}</p>
          <button
            onClick={() => {
              setError(null);
              startConversation();
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: VOICE_COLORS.purple }}
          >
            Retry
          </button>
        </div>
      )}
      </div>
      <p className="text-white/40 text-xs tracking-widest uppercase mt-1.5 mr-1 font-light">Let&apos;s talk</p>
    </div>
  );
}
