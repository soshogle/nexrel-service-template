import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "wouter";
import { MapPin, ArrowRight, Phone, Star, Home as HomeIcon, Key, TrendingUp, Quote, Shield } from "lucide-react";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";
import { useTranslation } from "react-i18next";

const FeaturedListings = lazy(() => import("./FeaturedListings"));

const THEODORA_HEADSHOT =
  import.meta.env.VITE_BROKER_HEADSHOT_URL ||
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663115065429/FXvMFuJPKwMDlplc.jpeg";

const HERO_INTERIORS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
];

function BrokerHeadshot({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className="relative w-full max-w-md mx-auto rounded-sm shadow-xl aspect-[3/4] bg-[#86C0C7]/20 flex items-center justify-center">
        <span className="font-serif text-[#214359] text-4xl font-medium">TS</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="relative w-full max-w-md mx-auto rounded-sm shadow-xl object-cover aspect-[3/4]"
      onError={() => setErrored(true)}
    />
  );
}

function HeroSection() {
  const { t } = useTranslation();
  const config = useAgencyConfig();
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const workingUrls = HERO_INTERIORS.filter((_, i) => !failedIndices.has(i));
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, workingUrls.length - 1)));
  }, [workingUrls.length]);

  useEffect(() => {
    if (workingUrls.length === 0) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % workingUrls.length), 5000);
    return () => clearInterval(id);
  }, [workingUrls.length]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (workingUrls.length <= 1) return;
    setIndex((i) => {
      if (direction === 'left') return (i + 1) % workingUrls.length;
      return (i - 1 + workingUrls.length) % workingUrls.length;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = Date.now();
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) handleSwipe('right');
    else if (dx < -50) handleSwipe('left');
    touchStart.current = null;
  };

  const handleImageError = (i: number) => {
    setFailedIndices((prev) => new Set([...prev, i]));
  };

  const showLogoFallback = workingUrls.length === 0;

  // Parse hero title to render <em> tag
  const heroTitleParts = t("home.heroTitle").split(/<em>(.*?)<\/em>/);

  return (
    <section
      className="relative w-full min-h-[max(85vh,400px)] sm:min-h-[max(85vh,500px)] md:min-h-[max(85vh,600px)] overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 z-0 bg-gradient-to-br from-[#1B3A4B] via-[#214359] to-[#2d5a6e]"
        aria-hidden
      />
      {showLogoFallback && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center" aria-hidden>
          <div className="text-center">
            <img
              src={config.logoUrl}
              alt={config.name}
              className="h-24 sm:h-28 w-auto mx-auto"
            />
            <p className="text-white/90 text-xl sm:text-2xl font-medium tracking-widest mt-3">{config.name}</p>
          </div>
        </div>
      )}
      {!showLogoFallback &&
        HERO_INTERIORS.map((src, i) =>
          failedIndices.has(i) ? null : (
            <div
              key={`hero-${i}`}
              className={`absolute inset-0 transition-opacity duration-[3000ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                workingUrls.indexOf(src) === index ? "opacity-100 z-[1]" : "opacity-0 z-[1]"
              }`}
            >
              <img
                src={src}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover ${
                  i % 3 === 0 ? "animate-ken-burns" : i % 3 === 1 ? "animate-ken-burns-alt" : "animate-ken-burns-alt2"
                }`}
                aria-hidden
                onError={() => handleImageError(i)}
              />
            </div>
          )
        )}
      {!showLogoFallback && (
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      )}

      <div className="relative z-20 h-full min-h-[600px] flex flex-col justify-center pt-20 pb-20">
        <div className="container">
          <div className="max-w-2xl animate-fade-in-up [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
            <p className="text-[#86C0C7] text-sm font-medium tracking-[0.3em] uppercase mb-6">
              {t("home.brokerSubtitle", { name: config.brokerName })}
            </p>
            <h1 className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
              {heroTitleParts.length === 3 ? (
                <>{heroTitleParts[0]}<em className="italic text-[#86C0C7]">{heroTitleParts[1]}</em>{heroTitleParts[2]}</>
              ) : (
                t("home.heroTitle")
              )}
            </h1>
            <p className="text-white/90 text-lg leading-relaxed mb-8 max-w-lg">
              {t("home.heroDescription", { languages: config.languages.join(", ").toLowerCase() })}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/properties"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#86C0C7] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#6AABB3] transition-all duration-300"
              >
                {t("common.viewProperties")}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-white/10 transition-all duration-300"
              >
                {t("common.getInTouch")}
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/selling" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">{t("home.lookingToSell")}</Link>
              <span className="text-white/40">|</span>
              <Link href="/buying" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">{t("home.lookingToBuy")}</Link>
              <span className="text-white/40">|</span>
              <Link href="/renting" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">{t("home.lookingToRent")}</Link>
              <span className="text-white/40">|</span>
              <Link href="/get-a-quote" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">{t("nav.getAQuote")}</Link>
              <span className="text-white/40">|</span>
              <Link href="/contact" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">{t("home.messageUs")}</Link>
            </div>

            <div className="flex gap-8 mt-12 pt-8 border-t border-white/20">
              <div>
                <p className="font-serif text-white text-3xl">RE/MAX</p>
                <p className="text-white/60 text-sm mt-1">3000 Inc.</p>
              </div>
              <div>
                <p className="font-serif text-white text-3xl">{config.languages.length}</p>
                <p className="text-white/60 text-sm mt-1">{t("home.languagesCount")}</p>
              </div>
              <div>
                <p className="font-serif text-white text-3xl">MTL</p>
                <p className="text-white/60 text-sm mt-1">{t("home.based")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-[#86C0C7] rounded-full" />
        </div>
      </div>
    </section>
  );
}

function AboutPreview() {
  const { t } = useTranslation();
  return (
    <section className="py-24 bg-[#f8f6f3]">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-slide-in-left">
            <div className="relative">
              <div className="absolute -bottom-4 -left-4 w-full h-full bg-[#86C0C7]/10 rounded-sm" />
              <BrokerHeadshot src={THEODORA_HEADSHOT} alt="Theodora Stavropoulos" />
            </div>
          </div>

          <div>
            <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              TS | {t("home.yourBroker")}
            </p>
            <h2 className="font-serif text-[#214359] text-3xl sm:text-4xl mb-6 italic">
              {t("home.montrealExpert")}
            </h2>
            <div className="w-16 h-0.5 bg-[#86C0C7] mb-8" />
            <p className="text-[#214359]/70 leading-relaxed mb-6">
              {t("home.aboutPreviewP1")}
            </p>
            <p className="text-[#214359]/70 leading-relaxed mb-8">
              {t("home.aboutPreviewP2")}
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#86C0C7]/10 rounded-full flex items-center justify-center">
                  <Star size={18} className="text-[#86C0C7]" />
                </div>
                <div>
                  <p className="font-medium text-[#214359] text-sm">RE/MAX 3000</p>
                  <p className="text-[#214359]/50 text-xs">{t("home.trustedAgency")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#86C0C7]/10 rounded-full flex items-center justify-center">
                  <MapPin size={18} className="text-[#86C0C7]" />
                </div>
                <div>
                  <p className="font-medium text-[#214359] text-sm">Montréal</p>
                  <p className="text-[#214359]/50 text-xs">{t("home.localExpert")}</p>
                </div>
              </div>
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm hover:gap-3 transition-all duration-300"
            >
              {t("home.learnMoreAboutMe")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TranquilliTSection() {
  const { t } = useTranslation();
  const config = useAgencyConfig();
  if (!config.tranquilliT) return null;
  return (
    <section className="py-16 bg-white border-y border-[#E8F4F4]">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#86C0C7]/10 flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7 text-[#86C0C7]" />
            </div>
            <div>
              <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-1">
                {t("home.tranquilliT")}
              </p>
              <h3 className="font-serif text-[#214359] text-xl">
                {t("home.peaceOfMind")}
              </h3>
              <p className="text-[#214359]/70 text-sm mt-1">
                {t("home.tranquilliTDesc")}
              </p>
            </div>
          </div>
          <a
            href={config.tranquilliTUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#214359] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#1a3648] transition-colors shrink-0"
          >
            {t("home.findOutMore")}
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const { t } = useTranslation();
  const services = [
    {
      icon: HomeIcon,
      title: t("home.buyingTitle"),
      description: t("home.buyingDesc"),
      link: "/properties?listingType=sale",
    },
    {
      icon: Key,
      title: t("home.rentingTitle"),
      description: t("home.rentingDesc"),
      link: "/properties?listingType=rent",
    },
    {
      icon: TrendingUp,
      title: t("home.sellingTitle"),
      description: t("home.sellingDesc"),
      link: "/contact",
    },
  ];
  return (
    <section className="py-24 bg-[#1B3A4B]">
      <div className="container">
        <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
          TS | {t("home.services")}
        </p>
        <h2 className="font-serif text-white text-3xl sm:text-4xl mb-12 italic">
          {t("home.howCanHelp")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {services.map((s) => (
            <div key={s.title} className="text-center">
              <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-[#86C0C7]/20 flex items-center justify-center">
                <s.icon className="w-7 h-7 text-[#86C0C7]" />
              </div>
              <h3 className="font-serif text-white text-xl mb-4">{s.title}</h3>
              <p className="text-white/70 text-base leading-relaxed mb-6">
                {s.description}
              </p>
              <Link
                href={s.link}
                className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm hover:gap-3 transition-all duration-300"
              >
                {t("common.learnMore")}
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = [
    { quote: t("home.testimonial1"), author: "Marie & Jean" },
    { quote: t("home.testimonial2"), author: "Alex K." },
  ];
  return (
    <section className="py-24 bg-white">
      <div className="container">
        <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
          TS | {t("home.testimonials")}
        </p>
        <h2 className="font-serif text-[#214359] text-3xl sm:text-4xl mb-12 italic">
          {t("home.whatClientsSay")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="p-8 border border-[#E8F4F4] rounded-sm bg-[#E8F4F4]/30"
            >
              <Quote className="w-10 h-10 text-[#86C0C7]/50 mb-4" />
              <p className="font-serif text-[#214359] text-lg italic mb-6">
                "{testimonial.quote}"
              </p>
              <p className="text-[#214359]/70 text-sm">— {testimonial.author}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-[#214359]/60 text-sm">
          {t("home.tranquilliTCertified")}
        </p>
      </div>
    </section>
  );
}

function CTASection() {
  const { t } = useTranslation();
  const ctaTitleParts = t("home.readyToFind").split(/<em>(.*?)<\/em>/);
  return (
    <section className="relative py-24 bg-[#214359]">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="container relative z-10 text-center">
        <h2 className="font-serif text-white text-3xl sm:text-4xl mb-6 italic">
          {ctaTitleParts.length === 3 ? (
            <>{ctaTitleParts[0]}<em className="italic text-[#86C0C7]">{ctaTitleParts[1]}</em>{ctaTitleParts[2]}</>
          ) : (
            t("home.readyToFind")
          )}
        </h2>
        <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10">
          {t("home.readyToFindDesc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#86C0C7] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#6AABB3] transition-colors duration-300"
          >
            {t("common.getInTouch")}
            <ArrowRight size={16} />
          </Link>
          <a
            href="tel:5143333000"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-white/10 transition-all duration-300"
          >
            <Phone size={16} />
            514 333-3000
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [showFeatured, setShowFeatured] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShowFeatured(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div>
      <HeroSection />
      <AboutPreview />
      <TranquilliTSection />
      {showFeatured && (
        <Suspense fallback={<div className="py-24 bg-[#E8F4F4]"><div className="container animate-pulse h-72 bg-gray-200/50 rounded" /></div>}>
          <FeaturedListings />
        </Suspense>
      )}
      <ServicesSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
