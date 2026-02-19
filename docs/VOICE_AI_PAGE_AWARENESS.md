# Voice AI Page Awareness

The Voice AI assistant can **see what the user sees** on the website and respond accordingly.

## How It Works

1. **Page context** — When the user navigates or views listings, the app sends context to the agent:
   - Current page (home, listings, property detail)
   - Visible listings (on search results pages)
   - Selected listing (when viewing a property detail)

2. **Dynamic variables** — Passed when the conversation starts:
   - `page_context` — JSON with path, pageType, visibleListings, selectedListing

3. **Context updates** — When the user navigates or selects a listing, the agent receives `sendContextualUpdate` with the new context.

4. **Client tools** — The agent can trigger actions:
   - **searchListings** — Search by bedrooms, city, listing_type; updates the UI and returns results
   - **showListing** — Navigate to a property detail page
   - **getListingDetails** — Fetch full property details for the agent to speak

## Example Flow

1. User: "Show me 3 bedroom listings in Ville Saint-Laurent"
2. Agent calls `searchListings({ bedrooms: 3, city: "Ville Saint-Laurent" })`
3. Client fetches from `/api/listings`, navigates to `/for-sale?bedrooms=3&city=Ville+Saint-Laurent`
4. Agent: "I found 5 listings. Let me show you." (UI already updated)
5. User clicks a listing → context updates with selectedListing
6. User: "Tell me more about this one"
7. Agent has full context and describes the property

## ElevenLabs Agent Setup

### Option A: Programmatic (recommended)

Run the CRM script to update all real estate website agents with the full tool schema:

```bash
npx tsx scripts/update-real-estate-agent-tools.ts
```

Or for a specific website:

```bash
npx tsx scripts/update-real-estate-agent-tools.ts <websiteId>
```

This updates the agent via the ElevenLabs API so the LLM knows about the new parameters (bathrooms, min_price, max_price, property_type).

### Option B: Manual dashboard

Configure these **client tools** in the [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai) dashboard:

1. Go to **Conversational AI** → **Your Agent** → **Customize** → **Tools**
2. Add or edit the **searchListings** client tool
3. Add each parameter below (name, type, description, optional)

### searchListings

- **Name:** `searchListings`
- **Description:** Search for property listings by criteria. Use when the user asks to see listings (e.g. "show me 2 bedroom houses in Saint-Laurent between 400000 and 500000", "find rentals in Ville Saint-Laurent", "2 bedroom apartments for rent under 2000"). Updates the page to show results on screen. Works for both **for sale** and **for rent**.
- **Parameters** (add each in the dashboard):

| Parameter       | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `bedrooms`     | number | no       | Number of bedrooms (e.g. 2) |
| `bathrooms`    | number | no       | Number of bathrooms (e.g. 2) |
| `city`         | string | no       | City or neighborhood (e.g. "Ville Saint-Laurent", "Montreal") |
| `listing_type` | string | no       | **"sale"** (for-sale) or **"rent"** (for-lease). Always pass "rent" when the user wants rentals. |
| `property_type`| string | no       | One of: "house", "condo", "apartment", "townhouse" |
| `min_price`    | number | no       | Minimum price (e.g. 400000) |
| `max_price`    | number | no       | Maximum price (e.g. 500000) |

For `property_type`, if the dashboard supports enum: add `["house", "condo", "apartment", "townhouse"]`.

### showListing

- **Name:** `showListing`
- **Description:** Navigate to and display a specific property. Use when the user wants to see a particular listing (e.g. "show me that one", "open the first result").
- **Parameters:**
  - `slug` (string, required) — Property slug (e.g. "centris-12345")

### getListingDetails

- **Name:** `getListingDetails`
- **Description:** Get full details of a property to describe to the user. Use when the user asks about a specific listing (e.g. "tell me more about this one", "what are the features?").
- **Parameters:**
  - `slug` (string, required) — Property slug

## System Prompt Suggestion

Add to your agent's system prompt:

```
You have access to the user's current page context via the page_context dynamic variable.
It includes: page (URL path), pageType (home/listings/property/other), visibleListings (array of listings on screen), selectedListing (the property they're viewing if on a detail page).

When the user asks to see listings, use searchListings. When they select or ask about a specific property, use getListingDetails to get full info, or showListing to navigate to it.
You can describe what they're looking at using the context — e.g. "You're viewing a 3-bedroom condo at 123 Main St for $450,000."
```
