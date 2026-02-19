# ElevenLabs Voice AI Setup (nexrel.soshogle.com-style)

The **ElevenLabs Voice AI** is the floating bubble concierge — same experience as nexrel.soshogle.com. Push to talk, real-time conversation, lead capture. **This is separate from Tavus** (which is the video avatar).

## Why the Voice AI might not show

The bubble appears only when **both** are true:

1. `enableVoiceAI` is true
2. `elevenLabsAgentId` is set

The template gets this from either the **CRM** or **environment variables**.

---

## Option A: CRM path (recommended for Website Builder)

When the site is created via the **nexrel-crm Website Builder** and linked to a Website record:

| Variable | Value |
|----------|-------|
| `NEXREL_CRM_URL` | CRM base URL (e.g. `https://www.nexrel.soshogle.com`) |
| `NEXREL_WEBSITE_ID` | Website ID from the builder |
| `WEBSITE_VOICE_CONFIG_SECRET` | Same secret as in CRM (for auth) |
| `WEBSITE_VOICE_LEAD_SECRET` | For lead webhook (optional but recommended) |

**In the CRM:** The Website must have **Voice AI enabled** and an **ElevenLabs agent** assigned. This happens when you enable "Voice AI Assistant" during website creation or in Website Settings.

---

## Option B: Standalone path (no Website Builder)

For sites deployed **without** a Website record (e.g. Theodora's direct deploy):

| Variable | Value |
|----------|-------|
| `NEXREL_ELEVENLABS_AGENT_ID` | Your ElevenLabs Conversational AI agent ID |

The bubble will show. **Leads will not push to CRM** unless you also set `NEXREL_CRM_URL`, `NEXREL_WEBSITE_ID`, and create a Website record for lead routing.

---

## For Theodora's site

**If using nexrel-service-temp (or this template) on Vercel:**

1. **Create a Website record** in nexrel-crm for Theodora:
   - Dashboard → Websites → Create (or use existing)
   - Enable **Voice AI Assistant**
   - Link to Theodora's ElevenLabs agent (from `setup-theodora-voice-agent` or create one)

2. **Add env vars** to the Vercel project (nexrel-service-temp or whichever serves the live URL):

   ```
   NEXREL_CRM_URL=https://www.nexrel.soshogle.com
   NEXREL_WEBSITE_ID=<website_id_from_step_1>
   WEBSITE_VOICE_CONFIG_SECRET=<same_as_crm>
   WEBSITE_VOICE_LEAD_SECRET=<same_as_crm>
   ```

3. **Redeploy** the site.

The floating voice bubble will appear. Leads from Voice AI conversations will go to Theodora's CRM.

---

## Time-aware greeting (Good morning/afternoon/evening)

The template overrides the agent's first message based on the visitor's local time. For this to work, **enable the "First message" override** in your ElevenLabs agent:

1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Open your agent → **Security** tab
3. Under **Overrides**, enable **First message**

Without this, the agent will use its default greeting (e.g. "Good morning" regardless of time).

---

## Checklist

- [ ] Website exists in CRM with Voice AI enabled and `elevenLabsAgentId` set
- [ ] `NEXREL_CRM_URL` and `NEXREL_WEBSITE_ID` set in Vercel
- [ ] `WEBSITE_VOICE_CONFIG_SECRET` set (must match CRM)
- [ ] First message override enabled in ElevenLabs agent (for time-aware greeting)
- [ ] Redeploy after changing env vars
