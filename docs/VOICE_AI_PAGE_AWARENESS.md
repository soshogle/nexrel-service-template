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

Configure these **client tools** in the [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai) dashboard:

### searchListings

- **Name:** `searchListings`
- **Description:** Search for property listings by criteria. Use when the user asks to see listings (e.g. "show me 3 bedroom homes in Montreal", "find rentals in Ville Saint-Laurent"). Updates the page to show results.
- **Parameters:**
  - `bedrooms` (number, optional) — Number of bedrooms
  - `city` (string, optional) — City or neighborhood (e.g. "Ville Saint-Laurent", "Montreal")
  - `listing_type` (string, optional) — "sale" or "rent"

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
