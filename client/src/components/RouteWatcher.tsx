/**
 * Watches route changes and updates PageContext for Voice AI.
 * Sets path and pageType; child pages (Properties, PropertyDetail) set listings.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePageContextOptional } from "@/contexts/PageContext";

export default function RouteWatcher() {
  const [location] = useLocation();
  const pageCtx = usePageContextOptional();

  useEffect(() => {
    if (!pageCtx) return;
    const path = location || "/";
    let pageType: "home" | "listings" | "property" | "other" = "other";
    if (path === "/") pageType = "home";
    else if (path.startsWith("/property/")) pageType = "property";
    else if (
      path.startsWith("/for-sale") ||
      path.startsWith("/for-lease") ||
      path.startsWith("/properties") ||
      path.startsWith("/prestige") ||
      path.startsWith("/secret-properties") ||
      path.startsWith("/sold") ||
      path.startsWith("/recently-leased") ||
      path.startsWith("/commercial-lease") ||
      path.startsWith("/commercial-sale")
    ) {
      pageType = "listings";
    }
    pageCtx.setPageContext({ path, pageType });
  }, [pageCtx, location]);

  return null;
}
