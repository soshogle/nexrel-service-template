import { Link, useLocation } from "wouter";
import { usePageContextOptional } from "@/contexts/PageContext";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import ElevenLabsVoiceAgent from "./ElevenLabsVoiceAgent";
import LanguageSwitcher from "./LanguageSwitcher";

/** Map href to pageLabels key for CRM custom overrides */
const HREF_TO_PAGE_LABEL: Record<string, string> = {
  "/properties": "properties",
  "/for-sale": "forSale",
  "/for-lease": "forLease",
  "/selling": "selling",
  "/buying": "buying",
  "/renting": "renting",
  "/prestige": "prestige",
  "/secret-properties": "secretProperties",
  "/blog": "blog",
};

/** Map href to i18n translation key for localized nav labels */
const HREF_TO_I18N_KEY: Record<string, string> = {
  "/": "nav.home",
  "/properties": "nav.properties",
  "/for-sale": "common.forSale",
  "/for-lease": "common.forLease",
  "/selling": "nav.selling",
  "/buying": "nav.buying",
  "/renting": "nav.renting",
  "/about": "nav.about",
  "/news": "nav.newsMedia",
  "/blog": "nav.blog",
  "/videos": "nav.videos",
  "/podcasts": "nav.podcasts",
  "/get-a-quote": "nav.getAQuote",
  "/contact": "nav.contact",
  "/secret-properties": "nav.secretProperties",
  "/sold": "nav.soldProperties",
  "/property-concierge": "nav.propertyConcierge",
  "/market-appraisal": "nav.marketAppraisal",
  "/prestige": "nav.prestige",
};

function resolveNavLabel(
  href: string,
  label: unknown,
  pageLabels: Record<string, string> | null | undefined,
  t: (key: string) => string
): string {
  // Prefer i18n for standard nav items so language switcher works (French, etc.)
  const i18nKey = HREF_TO_I18N_KEY[href];
  if (i18nKey) {
    const translated = t(i18nKey);
    if (typeof translated === "string" && translated !== i18nKey) return translated;
  }
  // Fallback: CRM custom pageLabels override
  const pageLabelKey = HREF_TO_PAGE_LABEL[href];
  if (pageLabelKey && pageLabels?.[pageLabelKey]) {
    const val = pageLabels[pageLabelKey];
    if (typeof val === "string") return val;
  }
  return typeof label === "string" ? label : String(label ?? "");
}

function Navigation() {
  const { t } = useTranslation();
  const config = useAgencyConfig();
  const navItems = config.navConfig?.navItems ?? [];
  const topLinks = config.navConfig?.topLinks ?? [];
  const pageLabels = config.pageLabels ?? {};
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [location] = useLocation();
  const isHome = location === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location]);

  const isActive = (href: string) => location === href || (href !== "/" && location.startsWith(href + "/"));

  const openVoiceAI = (opts?: { requestCallback?: boolean }) => {
    window.dispatchEvent(new CustomEvent("openVoiceAI", { detail: opts ?? {} }));
  };

  const allLinks = [
    ...(Array.isArray(topLinks) ? topLinks : []).filter((l: { href?: string }) => l?.href !== "/"),
    ...(Array.isArray(navItems) ? navItems : []).filter((item: { href?: string }) => !topLinks.some((tl: { href?: string }) => tl?.href === item?.href)),
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}>
      <div className={`transition-all duration-500 ${isHome && !scrolled ? 'bg-transparent' : 'bg-[#214359]/95 backdrop-blur-md shadow-lg'}`}>
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <img
                src={String(config.logoUrl ?? "")}
                alt={String(config.name ?? "")}
                className="h-10 w-auto max-w-[180px] object-contain object-left"
              />
              <span className="hidden sm:inline text-white/80 text-xs tracking-widest uppercase font-medium">
                {String(resolveNavLabel("/", "Home", pageLabels, t))}
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {allLinks.map((item, idx) => {
                const navItem = Array.isArray(navItems) ? navItems.find((n: { href?: string }) => n?.href === item?.href) : undefined;
                const children = navItem?.children;
                const itemLabel = String(resolveNavLabel(item?.href ?? "", item?.label, pageLabels, t));
                return (
                  <div
                    key={String(item?.href ?? item?.label ?? idx)}
                    className="relative group"
                    onMouseEnter={() => children?.length ? setOpenDropdown(itemLabel) : undefined}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={String(item?.href ?? "#")}
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium tracking-widest uppercase transition-colors ${
                        isActive(String(item?.href ?? "")) ? "text-[#86C0C7]" : "text-white/80 hover:text-[#86C0C7]"
                      }`}
                    >
                      {itemLabel}
                      {children?.length ? <ChevronDown size={14} className="opacity-70" /> : null}
                    </Link>
                    {children && (openDropdown === itemLabel) && (
                      <div className="absolute top-full left-0 pt-1 min-w-[200px]">
                        <div className="bg-[#214359] border border-white/10 rounded-sm py-2 shadow-xl">
                          {(Array.isArray(children) ? children : []).map((child: { href?: string; label?: unknown }, cidx: number) => (
                            <Link
                              key={String(child?.href ?? child?.label ?? cidx)}
                              href={String(child?.href ?? "#")}
                              className={`block px-4 py-2 text-sm tracking-wider uppercase transition-colors ${
                                isActive(String(child?.href ?? "")) ? "text-[#86C0C7] bg-white/5" : "text-white/80 hover:text-[#86C0C7] hover:bg-white/5"
                              }`}
                            >
                              {String(resolveNavLabel(child?.href ?? "", child?.label, pageLabels, t))}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center gap-2 ml-2 border-l border-white/20 pl-3">
                <LanguageSwitcher className="" />
                {config.phone && (
                  <>
                    <span className="text-white/30 text-xs">|</span>
                    <a href={`tel:${String(config.phone).replace(/\s/g, "")}`} className="text-xs text-white/60 hover:text-[#86C0C7] transition-colors whitespace-nowrap">
                      {String(config.phone)}
                    </a>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => openVoiceAI({ requestCallback: true })}
                className="ml-3 px-5 py-2.5 bg-[#86C0C7] text-white text-sm font-medium tracking-wider uppercase rounded-sm hover:bg-[#6AABB3] transition-colors"
              >
                {String(t("nav.callNow"))}
              </button>
            </nav>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-white min-h-[44px] min-w-[44px] flex items-center justify-center p-2 -m-2"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-[#214359]/98 backdrop-blur-md border-t border-white/10 max-h-[80vh] overflow-y-auto">
          <nav className="container py-6 flex flex-col gap-2">
            {allLinks.map((item, idx) => {
              const navItem = Array.isArray(navItems) ? navItems.find((n: { href?: string }) => n?.href === item?.href) : undefined;
              const children = navItem?.children;
              return (
                <div key={String(item?.href ?? item?.label ?? idx)}>
                  <Link
                    href={String(item?.href ?? "#")}
                    className={`block py-2 text-sm font-medium tracking-widest uppercase ${
                      isActive(String(item?.href ?? "")) ? "text-[#86C0C7]" : "text-white/80"
                    }`}
                  >
                    {String(resolveNavLabel(item?.href ?? "", item?.label, pageLabels, t))}
                  </Link>
                  {Array.isArray(children) && children.length > 0 && (
                    <div className="pl-4 space-y-1 border-l border-white/20 ml-2">
                      {children.map((child: { href?: string; label?: unknown }, cidx: number) => (
                        <Link
                          key={String(child?.href ?? child?.label ?? cidx)}
                          href={String(child?.href ?? "#")}
                          className={`block py-1.5 text-xs tracking-wider uppercase ${
                            isActive(String(child?.href ?? "")) ? "text-[#86C0C7]" : "text-white/60"
                          }`}
                        >
                          {String(resolveNavLabel(child?.href ?? "", child?.label, pageLabels, t))}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <LanguageSwitcher className="mt-4 justify-center" />
            <button
              type="button"
              onClick={() => {
                openVoiceAI({ requestCallback: true });
                setMobileOpen(false);
              }}
              className="mt-4 w-full px-5 py-3 bg-[#86C0C7] text-white text-sm font-medium tracking-wider uppercase rounded-sm text-center"
            >
              {String(t("nav.callNow"))}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { t } = useTranslation();
  const config = useAgencyConfig();
  const footerLinks = Array.isArray(config.navConfig?.footerLinks) ? config.navConfig.footerLinks : [];
  const pageLabels = config.pageLabels ?? {};

  const safeStr = (v: unknown, fallback = ""): string => {
    if (v == null) return fallback;
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return fallback;
  };

  return (
    <footer className="bg-[#214359] text-white/80">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h3 className="font-serif text-white text-xl mb-4">{safeStr(config.name, "Agency")}</h3>
            <p className="text-sm leading-relaxed text-white/60 mb-4">
              {safeStr(config.tagline)}. {String(t("footer.taglineDesc"))}
            </p>
          </div>

          <div>
            <h4 className="font-serif text-white text-lg mb-4">{String(t("footer.quickLinks"))}</h4>
            <ul className="space-y-2">
              {footerLinks.slice(0, 5).map((link: { href?: string; label?: unknown }, i: number) => (
                <li key={String(link?.href ?? i)}>
                  <Link href={String(link?.href ?? "#")} className="text-sm text-white/60 hover:text-[#86C0C7] transition-colors">
                    {String(resolveNavLabel(link?.href ?? "", link?.label, pageLabels, t))}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-white text-lg mb-4">{String(t("footer.more"))}</h4>
            <ul className="space-y-2">
              {footerLinks.slice(5).map((link: { href?: string; label?: unknown }, i: number) => (
                <li key={String(link?.href ?? i + 5)}>
                  <Link href={String(link?.href ?? "#")} className="text-sm text-white/60 hover:text-[#86C0C7] transition-colors">
                    {String(resolveNavLabel(link?.href ?? "", link?.label, pageLabels, t))}
                  </Link>
                </li>
              ))}
              {config.remaxProfileUrl && (
                <li>
                  <a
                    href={String(config.remaxProfileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/60 hover:text-[#86C0C7] transition-colors"
                  >
                    {String(t("common.remaxProfile"))}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-white text-lg mb-4">{String(t("footer.contactUs"))}</h4>
            <p className="text-sm text-white/60 mb-2">
              {safeStr(config.address)}<br />
              {safeStr(config.city)} ({safeStr(config.neighborhood)}), {safeStr(config.province)} {safeStr(config.postalCode)}
            </p>
            <p className="text-sm text-white/60 mb-2">
              {String(t("common.phone"))}: <a href={`tel:${String(config.phone || "").replace(/\s/g, "")}`} className="hover:text-[#86C0C7]">{safeStr(config.phone)}</a>
            </p>
            <a href={`mailto:${safeStr(config.email)}`} className="text-sm text-white/60 hover:text-[#86C0C7] transition-colors">
              {safeStr(config.email)}
            </a>
            <br />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(safeStr(config.fullAddress))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-5 py-2.5 border border-[#86C0C7] text-[#86C0C7] text-sm font-medium tracking-wider uppercase rounded-sm hover:bg-[#86C0C7] hover:text-white transition-all"
            >
              {String(t("common.getDirections"))}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            {String(t("footer.copyright", { year: new Date().getFullYear(), name: safeStr(config.name) }))}
          </p>
          <p className="text-xs text-white/40">
            {String(t("footer.subtitle"))}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const pageCtx = usePageContextOptional();
  const { data: voiceConfig } = trpc.voiceConfig.get.useQuery();

  // Wire wouter navigation for Voice AI client tools (setNavigate uses ref, no re-render loop)
  useEffect(() => {
    if (pageCtx) pageCtx.setNavigate(setLocation);
  }, [pageCtx?.setNavigate, setLocation]);

  const showElevenLabs = !!(voiceConfig?.enableVoiceAI && voiceConfig?.elevenLabsAgentId);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
      {showElevenLabs && (
        <ElevenLabsVoiceAgent
          agentId={voiceConfig!.elevenLabsAgentId!}
          websiteId={voiceConfig?.websiteId ?? null}
          customPrompt={voiceConfig?.customPrompt ?? null}
        />
      )}
    </div>
  );
}
