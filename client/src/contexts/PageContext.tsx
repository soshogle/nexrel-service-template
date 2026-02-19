/**
 * Page context for Voice AI — tells the agent what the user is looking at.
 * Used for "show me 3 bedroom listings in Ville Saint-Laurent" and
 * "tell me more about this one" flows.
 */
import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, type ReactNode } from "react";

export interface ListingSummary {
  id: number;
  slug: string;
  title: string;
  address: string;
  city: string;
  price: string;
  priceLabel: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  listingType: string;
  description?: string;
}

export interface PageContextValue {
  path: string;
  pageType: "home" | "listings" | "property" | "other";
  visibleListings: ListingSummary[];
  selectedListing: ListingSummary | null;
  /** Address/area the user searched on the map — used by Voice AI when user says "find a house here" */
  searchAddress: string | null;
  setPageContext: (ctx: Partial<{
    path: string;
    pageType: PageContextValue["pageType"];
    visibleListings: ListingSummary[];
    selectedListing: ListingSummary | null;
    searchAddress: string | null;
  }>) => void;
  /** Called by Voice Agent when conversation starts — used to push context updates */
  registerContextUpdater: (fn: (ctx: PageContextValue) => void) => () => void;
  /** Navigate to path — set by Layout from wouter's setLocation */
  navigate: (path: string) => void;
  setNavigate: (fn: (path: string) => void) => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState("");
  const [pageType, setPageType] = useState<PageContextValue["pageType"]>("other");
  const [visibleListings, setVisibleListings] = useState<ListingSummary[]>([]);
  const [selectedListing, setSelectedListing] = useState<ListingSummary | null>(null);
  const [searchAddress, setSearchAddress] = useState<string | null>(null);
  const [navigateFn, setNavigateFn] = useState<(path: string) => void>(() => (p: string) => { window.location.href = p; });

  const setPageContext = useCallback((ctx: Partial<PageContextValue>) => {
    if (ctx.path !== undefined) setPath(ctx.path);
    if (ctx.pageType !== undefined) setPageType(ctx.pageType);
    if (ctx.visibleListings !== undefined) setVisibleListings(ctx.visibleListings);
    if (ctx.selectedListing !== undefined) setSelectedListing(ctx.selectedListing);
    if (ctx.searchAddress !== undefined) setSearchAddress(ctx.searchAddress);
  }, []);

  // Notify Voice Agent when context changes (for sendContextualUpdate)
  const updaterRef = useRef<((v: PageContextValue) => void) | null>(null);
  const registerContextUpdater = useCallback((fn: (ctx: PageContextValue) => void) => {
    updaterRef.current = fn;
    return () => { updaterRef.current = null; };
  }, []);


  const setNavigate = useCallback((fn: (path: string) => void) => {
    setNavigateFn(() => fn);
  }, []);

  const value = useMemo<PageContextValue>(
    () => ({
      path,
      pageType,
      visibleListings,
      selectedListing,
      searchAddress,
      setPageContext,
      registerContextUpdater,
      navigate: navigateFn,
      setNavigate,
    }),
    [path, pageType, visibleListings, selectedListing, searchAddress, setPageContext, registerContextUpdater, navigateFn, setNavigate]
  );

  useEffect(() => {
    updaterRef.current?.({ path, pageType, visibleListings, selectedListing, searchAddress, setPageContext, registerContextUpdater, navigate: navigateFn, setNavigate });
  }, [path, pageType, visibleListings, selectedListing, searchAddress]);

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

export function usePageContext() {
  const ctx = useContext(PageContext);
  if (!ctx) throw new Error("usePageContext must be used within PageContextProvider");
  return ctx;
}

export function usePageContextOptional() {
  return useContext(PageContext);
}
