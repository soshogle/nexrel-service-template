/**
 * Tavus conversation webhook handler.
 * Receives callbacks when conversations end (transcription_ready) and extracts/stores leads.
 */
import type { Request, Response } from "express";
import * as db from "./db";

// Regex patterns for extracting contact info from transcript
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
const NAME_PATTERNS = [
  /(?:my name is|i'm|i am|call me|this is)\s+([A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s-]{2,50})/i,
  /(?:name is|named)\s+([A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s-]{2,50})/i,
  /^([A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s-]{2,50})$/m,
];

interface TranscriptMessage {
  role: string;
  content: string;
}

function extractFromTranscript(transcript: TranscriptMessage[]): { name?: string; email?: string; phone?: string } {
  const allUserText = transcript
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");

  const result: { name?: string; email?: string; phone?: string } = {};

  // Email
  const emails = allUserText.match(EMAIL_REGEX);
  if (emails?.length) {
    // Prefer non-system emails
    const real = emails.find((e) => !e.includes("example") && !e.includes("test"));
    result.email = (real || emails[0]).trim();
  }

  // Phone
  const phones = allUserText.match(PHONE_REGEX);
  if (phones?.length) {
    result.phone = phones[0].replace(/\s/g, "").trim();
  }

  // Name - try patterns
  for (const pattern of NAME_PATTERNS) {
    const match = allUserText.match(pattern);
    if (match) {
      const name = match[1].trim();
      if (name.length >= 2 && name.length <= 50) {
        result.name = name;
        break;
      }
    }
  }

  return result;
}

function transcriptToSummary(transcript: TranscriptMessage[]): string {
  const turns = transcript
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `${m.role}: ${m.content}`)
    .slice(0, 20); // First 20 turns
  return turns.join("\n\n") || "No transcript.";
}

export async function handleTavusWebhook(req: Request, res: Response): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const body = req.body as {
    event_type?: string;
    conversation_id?: string;
    properties?: { transcript?: TranscriptMessage[]; shutdown_reason?: string };
  };

  const eventType = body?.event_type;
  const conversationId = body?.conversation_id;

  // Always respond 200 quickly so Tavus doesn't retry
  res.status(200).json({ received: true });

  if (!eventType) return;

  console.log(`[Tavus webhook] ${eventType} conversation=${conversationId}`);

  if (eventType === "application.transcription_ready") {
    const transcript = body?.properties?.transcript;
    if (!transcript?.length) return;

    const extracted = extractFromTranscript(transcript);
    const summary = transcriptToSummary(transcript);

    // Only create inquiry if we have at least name or email
    const hasLead = extracted.name || extracted.email;
    if (!hasLead) {
      console.log("[Tavus webhook] No lead info extracted, skipping inquiry");
      return;
    }

    try {
      await db.createInquiry({
        propertyId: null,
        name: extracted.name || "Tavus Visitor",
        email: extracted.email || `tavus+${conversationId || "unknown"}@lead.local`,
        phone: extracted.phone || null,
        message: `[Tavus AI conversation]\n\n${summary}`,
      });
      console.log(`[Tavus webhook] Lead saved to inquiries: ${extracted.name || "—"} ${extracted.email || "—"}`);
    } catch (err) {
      console.error("[Tavus webhook] Failed to save lead to inquiries:", err);
    }

    // Push to nexrel-crm if configured (only when we have real contact info, not placeholder email)
    const crmUrl = process.env.NEXREL_CRM_URL;
    const crmLeadOwnerId = process.env.NEXREL_CRM_LEAD_OWNER_ID;
    const webhookSecret = process.env.TAVUS_WEBHOOK_SECRET;
    const hasRealEmail = extracted.email && !extracted.email.includes("@lead.local");

    if (crmUrl && crmLeadOwnerId && (extracted.name || hasRealEmail)) {
      try {
        const crmRes = await fetch(`${crmUrl.replace(/\/$/, "")}/api/webhooks/tavus-lead`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(webhookSecret ? { "x-tavus-webhook-secret": webhookSecret } : {}),
          },
          body: JSON.stringify({
            name: extracted.name || "Tavus Visitor",
            email: hasRealEmail ? extracted.email : undefined,
            phone: extracted.phone || undefined,
            transcript: summary,
          }),
        });

        if (crmRes.ok) {
          const data = (await crmRes.json()) as { leadId?: string };
          console.log(`[Tavus webhook] Pushed to nexrel-crm: leadId=${data.leadId}`);
        } else {
          const errText = await crmRes.text();
          console.error(`[Tavus webhook] CRM push failed ${crmRes.status}:`, errText);
        }
      } catch (err) {
        console.error("[Tavus webhook] Failed to push to nexrel-crm:", err);
      }
    }
  } else if (eventType === "system.shutdown") {
    const reason = body?.properties?.shutdown_reason;
    console.log(`[Tavus webhook] Conversation ended: ${reason}`);
  }
}
