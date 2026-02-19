/** Nav item shape — label, href, optional children */
export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

/** Nav config — navItems, topLinks, footerLinks from CRM */
export interface NavConfig {
  navItems: NavItem[];
  topLinks: { label: string; href: string }[];
  footerLinks: { label: string; href: string }[];
}

/** Default nav — used when CRM returns no navConfig */
export const DEFAULT_NAV_CONFIG: NavConfig = {
  navItems: [
    { label: "Selling", href: "/selling", children: [{ label: "For Sale", href: "/for-sale" }, { label: "Sold Properties", href: "/sold" }, { label: "Property Concierge", href: "/property-concierge" }, { label: "Market Appraisal", href: "/market-appraisal" }] },
    { label: "Buying", href: "/buying", children: [{ label: "For Sale", href: "/for-sale" }, { label: "Prestige Properties", href: "/prestige" }, { label: "Secret Properties", href: "/secret-properties" }] },
    { label: "Renting", href: "/renting", children: [{ label: "For Lease", href: "/for-lease" }] },
    { label: "About", href: "/about", children: undefined },
    { label: "News & Media", href: "/news", children: [{ label: "Blog", href: "/blog" }] },
  ],
  topLinks: [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: "Get A Quote", href: "/get-a-quote" },
    { label: "Contact", href: "/contact" },
    { label: "Secret Properties", href: "/secret-properties" },
  ],
  footerLinks: [
    { label: "Properties", href: "/properties" },
    { label: "Buying", href: "/buying" },
    { label: "Selling", href: "/selling" },
    { label: "Renting", href: "/renting" },
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
};

/** Default page labels — used when CRM returns no pageLabels */
export const DEFAULT_PAGE_LABELS: Record<string, string> = {
  properties: "Properties",
  forSale: "For Sale",
  forLease: "For Lease",
  selling: "Selling",
  buying: "Buying",
  renting: "Renting",
  prestige: "Prestige Properties",
  secretProperties: "Secret Properties",
};

/**
 * Default agency configuration — owner-agnostic placeholders.
 * Overridden at runtime from CRM when NEXREL_WEBSITE_ID is set.
 * Use useAgencyConfig() hook to get the resolved config (CRM or defaults).
 */
export const DEFAULT_AGENCY_CONFIG = {
  brokerName: "Real Estate Professional",
  name: "Your Agency",
  logoUrl: "/placeholder-logo.svg",
  tagline: "Your trusted real estate partner",
  address: "",
  neighborhood: "",
  city: "",
  province: "",
  postalCode: "",
  fullAddress: "",
  phone: "",
  fax: "",
  email: "",
  languages: ["English"] as const,
  remaxProfileUrl: "",
  tranquilliT: false,
  tranquilliTUrl: "",
  fullAgencyMode: true,
  navConfig: DEFAULT_NAV_CONFIG,
  pageLabels: DEFAULT_PAGE_LABELS,
} as const;

export type AgencyConfig = Omit<typeof DEFAULT_AGENCY_CONFIG, "navConfig" | "pageLabels"> & {
  navConfig: NavConfig;
  pageLabels: Record<string, string>;
};
