import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "wouter";
import { MapPin, ArrowRight, Phone, Star, Home as HomeIcon, Key, TrendingUp, Quote, Shield } from "lucide-react";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";

const FeaturedListings = lazy(() => import("./FeaturedListings"));

/** Broker headshot (AboutPreview only — not in hero). Set VITE_BROKER_HEADSHOT_URL if default fails. */
const THEODORA_HEADSHOT =
  import.meta.env.VITE_BROKER_HEADSHOT_URL ||
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663115065429/FXvMFuJPKwMDlplc.jpeg";

/** Hero background images — omit broken ones; fallback to RE/MAX 3000 logo when none load */
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
    const minSwipe = 50;
    if (dx > 50) handleSwipe('right');
    else if (dx < -50) handleSwipe('left');
    touchStart.current = null;
  };

  const handleImageError = (i: number) => {
    setFailedIndices((prev) => new Set([...prev, i]));
  };

  const showLogoFallback = workingUrls.length === 0;

  return (
    <section
      className="relative w-full min-h-[max(85vh,400px)] sm:min-h-[max(85vh,500px)] md:min-h-[max(85vh,600px)] overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Gradient background (always visible; images layer on top) */}
      <div
        className="absolute inset-0 z-0 bg-gradient-to-br from-[#1B3A4B] via-[#214359] to-[#2d5a6e]"
        aria-hidden
      />
      {/* RE/MAX 3000 logo when no hero images load — exact official logo */}
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
      {/* Hero slideshow — cinematic Ken Burns with varied motion per slide */}
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
      {/* Subtle vignette overlay — cinematic depth */}
      {!showLogoFallback && (
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      )}

      {/* Text content overlaid on top — subtle shadow for readability without overlay */}
      <div className="relative z-20 h-full min-h-[600px] flex flex-col justify-center pt-20 pb-20">
        <div className="container">
          <div className="max-w-2xl animate-fade-in-up [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
            <p className="text-[#86C0C7] text-sm font-medium tracking-[0.3em] uppercase mb-6">
              {config.brokerName} — Residential Real Estate Broker
            </p>
            <h1 className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
              Find Your <em className="italic text-[#86C0C7]">Perfect Home</em> in Montréal
            </h1>
            <p className="text-white/90 text-lg leading-relaxed mb-8 max-w-lg">
              With personalized service in {config.languages.join(", ").toLowerCase()}, I'm dedicated to making your
              real estate journey seamless and successful.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/properties"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#86C0C7] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#6AABB3] transition-all duration-300"
              >
                View Properties
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-white/10 transition-all duration-300"
              >
                Get in Touch
              </Link>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/selling" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">I'm looking to sell</Link>
              <span className="text-white/40">|</span>
              <Link href="/buying" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">I'm looking to buy</Link>
              <span className="text-white/40">|</span>
              <Link href="/renting" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">I'm looking to rent</Link>
              <span className="text-white/40">|</span>
              <Link href="/get-a-quote" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">Get A Quote</Link>
              <span className="text-white/40">|</span>
              <Link href="/contact" className="text-white/80 hover:text-[#86C0C7] text-sm tracking-wider uppercase transition-colors">Message Us</Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-white/20">
              <div>
                <p className="font-serif text-white text-3xl">RE/MAX</p>
                <p className="text-white/60 text-sm mt-1">3000 Inc.</p>
              </div>
              <div>
                <p className="font-serif text-white text-3xl">{config.languages.length}</p>
                <p className="text-white/60 text-sm mt-1">Languages (EN, FR, GR)</p>
              </div>
              <div>
                <p className="font-serif text-white text-3xl">MTL</p>
                <p className="text-white/60 text-sm mt-1">Based</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-[#86C0C7] rounded-full" />
        </div>
      </div>
    </section>
  );
}

function AboutPreview() {
  return (
    <section className="py-24 bg-[#f8f6f3]">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="animate-slide-in-left">
            <div className="relative">
              <div className="absolute -bottom-4 -left-4 w-full h-full bg-[#86C0C7]/10 rounded-sm" />
              <BrokerHeadshot src={THEODORA_HEADSHOT} alt="Theodora Stavropoulos" />
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              TS | YOUR BROKER
            </p>
            <h2 className="font-serif text-[#214359] text-3xl sm:text-4xl mb-6 italic">
              Your Montréal Real Estate Expert
            </h2>
            <div className="w-16 h-0.5 bg-[#86C0C7] mb-8" />
            <p className="text-[#214359]/70 leading-relaxed mb-6">
              As a Residential Real Estate Broker at RE/MAX 3000 Inc., I bring dedication, market knowledge,
              and a personal touch to every transaction. Whether you're looking to buy, sell, or rent in
              Montréal, I'm here to guide you every step of the way.
            </p>
            <p className="text-[#214359]/70 leading-relaxed mb-8">
              Fluent in English, French, and Greek, I serve a diverse clientele across Montréal's vibrant
              neighborhoods — from the Plateau to Villeray, Saint-Laurent to Ville-Marie.
            </p>

            {/* Highlights */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#86C0C7]/10 rounded-full flex items-center justify-center">
                  <Star size={18} className="text-[#86C0C7]" />
                </div>
                <div>
                  <p className="font-medium text-[#214359] text-sm">RE/MAX 3000</p>
                  <p className="text-[#214359]/50 text-xs">Trusted Agency</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#86C0C7]/10 rounded-full flex items-center justify-center">
                  <MapPin size={18} className="text-[#86C0C7]" />
                </div>
                <div>
                  <p className="font-medium text-[#214359] text-sm">Montréal</p>
                  <p className="text-[#214359]/50 text-xs">Local Expert</p>
                </div>
              </div>
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm hover:gap-3 transition-all duration-300"
            >
              Learn More About Me
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TranquilliTSection() {
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
                Broker participating in the Tranquilli-T program
              </p>
              <h3 className="font-serif text-[#214359] text-xl">
                Peace of mind guaranteed!
              </h3>
              <p className="text-[#214359]/70 text-sm mt-1">
                Exclusive protection to safeguard you in 4 components
              </p>
            </div>
          </div>
          <a
            href={config.tranquilliTUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#214359] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#1a3648] transition-colors shrink-0"
          >
            Find out more
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const services = [
    {
      icon: HomeIcon,
      title: "Buying",
      description: "Find your dream home with expert guidance through every step of the buying process.",
      link: "/properties?listingType=sale",
    },
    {
      icon: Key,
      title: "Renting",
      description: "Discover rental properties that match your lifestyle and budget in Montréal.",
      link: "/properties?listingType=rent",
    },
    {
      icon: TrendingUp,
      title: "Selling",
      description: "Maximize your property's value with strategic pricing and professional marketing.",
      link: "/contact",
    },
  ];
  return (
    <section className="py-24 bg-[#1B3A4B]">
      <div className="container">
        <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
          TS | SERVICES
        </p>
        <h2 className="font-serif text-white text-3xl sm:text-4xl mb-12 italic">
          How I Can Help
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
                Learn More
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
  const testimonials = [
    {
      quote: "Theodora made our home-buying experience seamless. Her knowledge of Montréal's neighborhoods is unmatched.",
      author: "Marie & Jean",
    },
    {
      quote: "Professional, responsive, and truly cares about finding the right fit. We couldn't have asked for a better broker.",
      author: "Alex K.",
    },
  ];
  return (
    <section className="py-24 bg-white">
      <div className="container">
        <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
          TS | TESTIMONIALS
        </p>
        <h2 className="font-serif text-[#214359] text-3xl sm:text-4xl mb-12 italic">
          What Clients Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-8 border border-[#E8F4F4] rounded-sm bg-[#E8F4F4]/30"
            >
              <Quote className="w-10 h-10 text-[#86C0C7]/50 mb-4" />
              <p className="font-serif text-[#214359] text-lg italic mb-6">
                "{t.quote}"
              </p>
              <p className="text-[#214359]/70 text-sm">— {t.author}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-[#214359]/60 text-sm">
          RE/MAX 3000 Inc. • Tranquilli-T Certified
        </p>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-24 bg-[#214359]">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="container relative z-10 text-center">
        <h2 className="font-serif text-white text-3xl sm:text-4xl mb-6 italic">
          Ready to Find Your <em className="italic text-[#86C0C7]">Home</em>?
        </h2>
        <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10">
          Whether you're buying, selling, or renting, I'm here to help. Let's start a conversation
          about your real estate goals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#86C0C7] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#6AABB3] transition-colors duration-300"
          >
            Get in Touch
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
