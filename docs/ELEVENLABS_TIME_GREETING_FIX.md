# Fix: Agent Says "Good Morning" at 9PM — Enable Overrides

The agent says "good morning" at night because **overrides are disabled** in ElevenLabs. The website sends a time-aware first message (e.g. "Good evening!") but ElevenLabs ignores it unless overrides are enabled.

## Fix (2 minutes)

### 1. Enable First Message Override in ElevenLabs

1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Open **Theodora's agent** (the one used for the website)
3. Click **Settings** or the gear icon
4. Open the **Security** tab
5. Find **"Allow overrides"** or **"First message"** override
6. **Enable** the "First message" override
7. Save

### 2. Redeploy the Website (if needed)

The template already sends the correct time-aware greeting. If your deployed site (theodora-stavropoulos-remax) doesn't have the latest code, push the template changes and redeploy.

---

## What the Code Does

When a visitor starts a conversation, the website:

1. Gets the visitor's local time (e.g. 9:15 PM EST)
2. Determines the period: morning (< 12), afternoon (< 17), evening (≥ 17)
3. Sends: `Good evening! I'm your real estate assistant. How can I help you today?`
4. ElevenLabs uses this **only if** "First message" override is enabled

Without overrides enabled, ElevenLabs uses the agent's default first message from the dashboard (which might say "Good morning!").
