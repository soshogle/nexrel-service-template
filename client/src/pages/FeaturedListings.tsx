import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MapPin, BedDouble, Bath, ArrowRight } from "lucide-react";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";

export default function FeaturedListings() {
  const config = useAgencyConfig();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { data: properties, isLoading } = trpc.properties.featured.useQuery({ limit: 4 });

  const formatPrice = (price: string, label?: string | null) => {
    const num = parseFloat(price);
    return `$${num.toLocaleString()}${label ? `/${label}` : "/mo"}`;
  };

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <section className="py-24 bg-[#E8F4F4]">
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
            TS | FEATURED PROPERTIES
          </p>
          <h2 className="font-serif text-[#214359] text-3xl sm:text-4xl italic">
            Current Listings
          </h2>
          <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse shrink-0 w-[min(400px,85vw)]">
                <div className="bg-gray-200 h-72 rounded-sm" />
                <div className="mt-4 space-y-2">
                  <div className="bg-gray-200 h-4 w-3/4 rounded" />
                  <div className="bg-gray-200 h-4 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          (() => {
            const realListings = properties.filter(
              (p) => p.mainImageUrl && p.mainImageUrl.startsWith("http")
            );
            if (realListings.length === 0) {
              return (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Properties coming soon. Check back shortly.</p>
                  <a
                    href={config.remaxProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-[#214359]/30 text-[#214359] font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#214359] hover:text-white transition-colors"
                  >
                    View my listings on RE/MAX
                    <ArrowRight size={16} />
                  </a>
                </div>
              );
            }
            return (
          <div className="relative">
            <Carousel
              opts={{ align: "start", loop: true }}
              setApi={setApi}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {realListings.map((property, idx) => (
                  <CarouselItem key={property.id} className="pl-4 basis-[min(400px,85vw)]">
                    <Link href={`/property/${property.slug}`} className="group property-card block">
                      <div className="relative overflow-hidden rounded-sm aspect-[4/3]">
                        <img
                          src={property.mainImageUrl}
                          alt={property.title}
                          className="listing-img-zoom w-full h-full object-cover"
                        />
                        {/* Vignette overlay — same as hero for cinematic depth */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          aria-hidden
                          style={{
                            background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)",
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 bg-[#214359]/90 backdrop-blur-sm px-4 py-2 rounded-sm">
                          <p className="text-white font-medium text-lg">
                            {formatPrice(property.price, property.priceLabel)}
                          </p>
                        </div>
                        <div className="absolute top-4 right-4 bg-[#86C0C7] px-3 py-1 rounded-sm">
                          <p className="text-white text-xs font-medium tracking-wider uppercase">
                            For {property.listingType === "sale" ? "Sale" : "Rent"}
                          </p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="font-serif text-white text-xl mb-2 group-hover:text-[#86C0C7] transition-colors">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-2 text-white/70 text-sm">
                            <MapPin size={14} />
                            <span>{property.address}, {property.city}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
                            {property.bedrooms && (
                              <span className="flex items-center gap-1">
                                <BedDouble size={14} />
                                {property.bedrooms} Beds
                              </span>
                            )}
                            {property.bathrooms && (
                              <span className="flex items-center gap-1">
                                <Bath size={14} />
                                {property.bathrooms} Bath
                              </span>
                            )}
                            {property.area && (
                              <span>{property.area} {property.areaUnit || "ft²"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-4 md:-left-12 border-[#214359] text-[#214359] hover:bg-[#214359] hover:text-white" />
              <CarouselNext className="-right-4 md:-right-12 border-[#214359] text-[#214359] hover:bg-[#214359] hover:text-white" />
            </Carousel>

            <div className="flex items-center justify-center gap-3 mt-8">
              <span className="text-sm font-medium text-[#214359]">
                {current + 1} — {realListings.length}
              </span>
              <div className="w-24 h-1 bg-[#214359]/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#86C0C7] transition-all duration-300"
                  style={{ width: `${((current + 1) / realListings.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
            );
          })()
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Properties coming soon. Check back shortly.</p>
            <a
              href={config.remaxProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#214359]/30 text-[#214359] font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#214359] hover:text-white transition-colors"
            >
              View my listings on RE/MAX
              <ArrowRight size={16} />
            </a>
          </div>
        )}

        <div className="text-center mt-12">
          {properties && properties.length > 0 ? (
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#214359] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#1a3648] transition-colors duration-300"
            >
              View All Properties
              <ArrowRight size={16} />
            </Link>
          ) : (
            <a
              href={config.remaxProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#214359] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#1a3648] transition-colors duration-300"
            >
              View listings on RE/MAX
              <ArrowRight size={16} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
