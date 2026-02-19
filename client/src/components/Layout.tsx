import { Link, useLocation } from "wouter";
import { usePageContextOptional } from "@/contexts/PageContext";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";
import { trpc } from "@/lib/trpc";
import ElevenLabsVoiceAgent from "./ElevenLabsVoiceAgent";

/** Map href to pageLabels key for nav link label overrides */
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

function resolveNavLabel(
  href: string,
  label: string,
  pageLabels: Record<string, string>
): string {
  const key = HREF_TO_PAGE_LABEL[href];
  return (key && pageLabels[key]) ?? label;
}

function Navigation() {
  const config = useAgencyConfig();
  const { navItems, topLinks } = config.navConfig;
  const { pageLabels } = config;
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

  const navBg = isHome && !scrolled
    ? "bg-transparent"
    : "bg-[#214359]/95 backdrop-blur-md shadow-lg";

  const isActive = (href: string) => location === href || (href !== "/" && location.startsWith(href + "/"));

  const openVoiceAI = (opts?: { requestCallback?: boolean }) => {
    window.dispatchEvent(new CustomEvent("openVoiceAI", { detail: opts ?? {} }));
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
      <div className="container">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <img
              src={config.logoUrl}
              alt={config.name}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const itemLabel = resolveNavLabel(item.href, item.label, pageLabels);
              return (
                <div
                  key={item.href}
                  className="relative group"
                  onMouseEnter={() => setOpenDropdown(itemLabel)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium tracking-widest uppercase transition-colors ${
                      isActive(item.href) ? "text-[#86C0C7]" : "text-white/80 hover:text-[#86C0C7]"
                    }`}
                  >
                    {itemLabel}
                    {item.children?.length ? <ChevronDown size={14} className="opacity-70" /> : null}
                  </Link>
                  {item.children && (openDropdown === itemLabel) && (
                    <div className="absolute top-full left-0 pt-1 min-w-[200px]">
                      <div className="bg-[#214359] border border-white/10 rounded-sm py-2 shadow-xl">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block px-4 py-2 text-sm tracking-wider uppercase transition-colors ${
                              isActive(child.href) ? "text-[#86C0C7] bg-white/5" : "text-white/80 hover:text-[#86C0C7] hover:bg-white/5"
                            }`}
                          >
                            {resolveNavLabel(child.href, child.label, pageLabels)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {topLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium tracking-widest uppercase transition-colors ${
                  isActive(link.href) ? "text-[#86C0C7]" : "text-white/80 hover:text-[#86C0C7]"
                }`}
              >
                {resolveNavLabel(link.href, link.label, pageLabels)}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => openVoiceAI({ requestCallback: true })}
              className="ml-2 px-5 py-2.5 bg-[#86C0C7] text-white text-sm font-medium tracking-wider uppercase rounded-sm hover:bg-[#6AABB3] transition-colors"
            >
              Call Now
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#214359]/98 backdrop-blur-md border-t border-white/10 max-h-[80vh] overflow-y-auto">
          <nav className="container py-6 flex flex-col gap-2">
            {navItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`block py-2 text-sm font-medium tracking-widest uppercase ${
                    isActive(item.href) ? "text-[#86C0C7]" : "text-white/80"
                  }`}
                >
                  {resolveNavLabel(item.href, item.label, pageLabels)}
                </Link>
                {item.children && (
                  <div className="pl-4 space-y-1 border-l border-white/20 ml-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block py-1.5 text-xs tracking-wider uppercase ${
                          isActive(child.href) ? "text-[#86C0C7]" : "text-white/60"
                        }`}
                      >
                        {resolveNavLabel(child.href, child.label, pageLabels)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {topLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 text-sm font-medium tracking-widest uppercase ${
                  isActive(link.href) ? "text-[#86C0C7]" : "text-white/80"
                }`}
              >
                {resolveNavLabel(link.href, link.label, pageLabels)}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                openVoiceAI({ requestCallback: true });
                setMobileOpen(false);
              }}
              className="mt-4 w-full px-5 py-3 bg-[#86C0C7] text-white text-sm font-medium tracking-wider uppercase rounded-sm text-center"
            >
              Call Now
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const config = useAgencyConfig();
  const { footerLinks } = config.navConfig;
  const { pageLabels } = config;
  return (
    <footer className="bg-[#214359] text-white/80">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h3 className="font-serif text-white text-xl mb-4">{config.name}</h3>
            <p className="text-sm leading-relaxed text-white/60 mb-4">
              {config.tagline}. We bring people together with homes using local knowledge
              and strong market experience.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-white text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {footerLinks?.slice(0, 5).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-[#86C0C7] transition-colors">
                    {resolveNavLabel(link.href, link.label, pageLabels)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-white text-lg mb-4">More</h4>
            <ul className="space-y-2">
              {footerLinks?.slice(5).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-[#86C0C7] transition-colors">
                    {resolveNavLabel(link.href, link.label, pageLabels)}
                  </Link>
                </li>
              ))}
              {config.remaxProfileUrl && (
                <li>
                  <a
                    href={config.remaxProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/60 hover:text-[#86C0C7] transition-colors"
                  >
                    RE/MAX Profile
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-white text-lg mb-4">Contact Us</h4>
            <p className="text-sm text-white/60 mb-2">
              {config.address}<br />
              {config.city} ({config.neighborhood}), {config.province} {config.postalCode}
            </p>
            <p className="text-sm text-white/60 mb-2">
              Phone: <a href={`tel:${config.phone.replace(/\s/g, "")}`} className="hover:text-[#86C0C7]">{config.phone}</a>
            </p>
            <a href={`mailto:${config.email}`} className="text-sm text-white/60 hover:text-[#86C0C7] transition-colors">
              {config.email}
            </a>
            <br />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.fullAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-5 py-2.5 border border-[#86C0C7] text-[#86C0C7] text-sm font-medium tracking-wider uppercase rounded-sm hover:bg-[#86C0C7] hover:text-white transition-all"
            >
              Get directions
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} {config.name}. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Residential Real Estate — Montréal
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

  // Wire wouter navigation for Voice AI client tools
  useEffect(() => {
    if (pageCtx) pageCtx.setNavigate(setLocation);
  }, [pageCtx, setLocation]);

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
