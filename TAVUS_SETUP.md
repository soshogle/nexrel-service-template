# Tavus AI Avatar Setup

The site includes a Tavus AI assistant (floating chat button) for real-time conversational lead capture. **Each owner configures their own avatar** via environment variables. The avatar can guide visitors, answer questions, and capture leads.

## Prerequisites

1. **Tavus account** — Sign up at [platform.tavus.io](https://platform.tavus.io)
2. **API key** — Create one in the Developer Portal
3. **Replica** — Create or select an AI avatar (e.g. digital twin of your broker)
4. **Persona** — Create a persona with a real estate system prompt and lead-capture behavior

## Environment Variables

### Production (Vercel) — required for avatar to show

**The avatar will not appear until these are set in Vercel.** Go to your Vercel project → Settings → Environment Variables and add:

**⚠️ Use the correct project:** The Theodora site at `nexrel-service-temp.vercel.app` deploys from the **nexrel-service-temp** project (repo: `soshogle/nexrel-service-temp`). Add env vars to **that** project, not "nexrel-service-template". Check your Vercel dashboard — you may have both; the one serving the live Theodora URL is the one that needs the vars.

| Variable | Value |
|----------|-------|
| `TAVUS_API_KEY` | Your Tavus API key |
| `TAVUS_REPLICA_ID` | Your Replica ID (e.g. `r6ca16dbe104`) |
| `TAVUS_PERSONA_ID` | Your Persona ID (e.g. `p1cd1dfaf75a`) |

Then redeploy. The avatar appears as a floating "AI Assistant" button in the bottom-right.

### Local development

Add to `.env`:

```
TAVUS_API_KEY=your_api_key
TAVUS_REPLICA_ID=rf4e9d9790f0
TAVUS_PERSONA_ID=pcb7a34da5fe
```

Replace with your actual Replica and Persona IDs from the Tavus platform.

## Persona Configuration

Configure your Persona with a system prompt like:

```
You are a helpful real estate assistant for RE/MAX 3000 Inc. in Montréal. Greet visitors warmly and ask what they need help with (buying, selling, renting). When appropriate, ask for their name, email, and phone to capture leads. If they share their screen, you can guide them through property listings. Be professional and helpful.
```

## Screen Share

For guided tours, visitors can share their screen from the chat interface. The avatar will then see what they see and can comment on the listing.

## Lead Capture (Webhooks)

When a `callback_url` is provided, Tavus sends POST requests to your backend when conversations end. This project includes a webhook handler that:

1. Receives `application.transcription_ready` callbacks
2. Extracts name, email, and phone from the transcript (regex-based)
3. Saves leads to the **Inquiries** table (visible in admin)

### Setup

1. **Set `TAVUS_CALLBACK_URL`** in `.env` (and Vercel Environment Variables):

   ```
   TAVUS_CALLBACK_URL=https://your-domain.com/api/webhooks/tavus
   ```

   Use your production URL. For local testing, use [ngrok](https://ngrok.com) to expose your dev server:
   ```bash
   ngrok http 3000
   # Then: TAVUS_CALLBACK_URL=https://xxxx.ngrok-free.app/api/webhooks/tavus
   ```

2. **Restart the app** — the `createConversation` endpoint will include `callback_url` in requests to Tavus.

3. **Verify** — after a conversation ends, Tavus POSTs to your webhook. Check server logs for `[Tavus webhook] Lead saved` and the Inquiries list in admin.

### Webhook Endpoint

- **URL:** `POST /api/webhooks/tavus`
- **Handled events:** `application.transcription_ready` (extracts leads), `system.shutdown` (logged)

### Extracted Data

The handler parses user messages for:
- **Email** — standard email format
- **Phone** — North American format (e.g. 514-333-3000)
- **Name** — phrases like "my name is X", "I'm X", "call me X"

Leads are only saved when at least name or email is found. The full transcript is stored in the inquiry message for context.

---

## Push to nexrel-crm (Option A)

When configured, Tavus leads are also pushed to the main nexrel-crm as **Leads** with the transcript as a **Note**. They appear in Contacts, can have tasks, and trigger workflow builder automations.

### Setup (nexrel-service-template)

Add to `.env`:

```
NEXREL_CRM_URL=https://your-nexrel-crm.vercel.app
NEXREL_CRM_LEAD_OWNER_ID=user_id_of_theodora_in_crm
TAVUS_WEBHOOK_SECRET=your_shared_secret
```

- **NEXREL_CRM_URL** — Base URL of your nexrel-crm deployment
- **NEXREL_CRM_LEAD_OWNER_ID** — The user ID in nexrel-crm who owns these leads (Theodora's account)
- **TAVUS_WEBHOOK_SECRET** — Optional; if set, must match the same value in nexrel-crm

### Setup (nexrel-crm)

Add to `.env.local` / Vercel Environment Variables:

```
NEXREL_CRM_LEAD_OWNER_ID=user_id_of_theodora_in_crm
TAVUS_WEBHOOK_SECRET=your_shared_secret
```

Or use existing `DEMO_LEAD_OWNER_ID` if that's already set for Theodora.

### What gets created in nexrel-crm

- **Lead** — Source: "Tavus AI", with name, email, phone
- **Note** — Full transcript attached to the lead
- **Workflow triggers** — If the lead owner has industry REAL_ESTATE, RE workflows are triggered
