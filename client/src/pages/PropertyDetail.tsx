import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { usePageContextOptional } from "@/contexts/PageContext";
import { trpc } from "@/lib/trpc";
import { MapPin, BedDouble, Bath, Ruler, ArrowLeft, ChevronLeft, ChevronRight, Phone, Mail, Share2, Heart, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapView } from "@/components/Map";
import MotionImage from "@/components/MotionImage";
import { toast } from "sonner";

const THEODORA_HEADSHOT = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663115065429/FXvMFuJPKwMDlplc.jpeg";

function PhotoGallery({ images }: { images: { url: string; alt?: string; motionDisabled?: boolean }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="bg-muted h-[500px] flex items-center justify-center rounded-sm">
        <p className="text-muted-foreground">No photos available</p>
      </div>
    );
  }

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <>
      {/* Main Image — Ken Burns / AgentPulse-style motion */}
      <div className="relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
        <div className="aspect-[16/9] overflow-hidden">
          <MotionImage
            src={images[currentIndex].url}
            alt={images[currentIndex].alt || "Property photo"}
            index={currentIndex}
            className="aspect-[16/9]"
            disabled={images[currentIndex].motionDisabled}
          />
        </div>
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={20} className="text-[#214359]" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={20} className="text-[#214359]" />
            </button>
          </>
        )}
        {/* Counter */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`shrink-0 w-20 h-16 rounded-sm overflow-hidden border-2 transition-all gallery-thumb ${
                i === currentIndex ? "active border-[#86C0C7]" : "border-transparent"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white" onClick={() => setLightboxOpen(false)}>
            <X size={28} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <img
            src={images[currentIndex].url}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

function PropertyInquiryForm({ propertyId, propertyTitle }: { propertyId: number; propertyTitle: string }) {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const submitInquiry = trpc.inquiries.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
      toast.success("Your inquiry has been sent. I'll get back to you soon.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    submitInquiry.mutate({
      propertyId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      message: `Inquiry about: ${propertyTitle}\n\n${formData.message}`,
    });
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-sm p-8 shadow-sm">
        <h2 className="font-serif text-[#214359] text-xl mb-4">Inquiry Sent</h2>
        <p className="text-[#214359]/70 mb-6">
          Thank you for your interest in this property. I'll review your message and get back to you shortly.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)} className="border-[#86C0C7] text-[#86C0C7] hover:bg-[#86C0C7]/10">
          Send Another Inquiry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm p-8 shadow-sm">
      <h2 className="font-serif text-[#214359] text-xl mb-4">Inquire About This Property</h2>
      <p className="text-[#214359]/70 mb-6">
        Interested in {propertyTitle}? Send me a message and I'll get back to you as soon as possible.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your full name"
            className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-11"
            required
          />
        </div>
        <div>
          <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Email *</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-11"
            required
          />
        </div>
        <div>
          <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Phone</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(514) 000-0000"
            className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-11"
          />
        </div>
        <div>
          <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Message *</label>
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Tell me about your interest in this property..."
            rows={4}
            className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm resize-none"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={submitInquiry.isPending}
          className="w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white tracking-wider uppercase text-sm py-3 h-auto rounded-sm"
        >
          {submitInquiry.isPending ? "Sending..." : <><Send size={14} className="mr-2" />Send Inquiry</>}
        </Button>
      </form>
    </div>
  );
}

function PropertyMap({ latitude, longitude, title }: { latitude: string; longitude: string; title: string }) {
  const handleMapReady = (map: google.maps.Map) => {
    const position = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
    new google.maps.Marker({
      position,
      map,
      title,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#86C0C7",
        fillOpacity: 1,
        strokeColor: "#214359",
        strokeWeight: 2,
        scale: 12,
      },
    });
  };

  return (
    <div className="rounded-sm overflow-hidden h-[400px]">
      <MapView
        onMapReady={handleMapReady}
        initialCenter={{ lat: parseFloat(latitude), lng: parseFloat(longitude) }}
        initialZoom={15}
      />
    </div>
  );
}

export default function PropertyDetail() {
  const [, params] = useRoute("/property/:slug");
  const slug = params?.slug || "";
  const [location] = useLocation();
  const pageCtx = usePageContextOptional();

  const { data: property, isLoading } = trpc.properties.getBySlug.useQuery({ slug });

  // Tell Voice AI which listing the user is viewing
  useEffect(() => {
    if (!pageCtx || !property) return;
    const summary = {
      id: property.id,
      slug: property.slug,
      title: property.title,
      address: property.address,
      city: property.city,
      price: property.price,
      priceLabel: property.priceLabel,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      listingType: property.listingType,
      description: property.description,
    };
    pageCtx.setPageContext({ path: location, pageType: "property", visibleListings: [], selectedListing: summary });
  }, [pageCtx, location, property]);

  const formatPrice = (price: string, label?: string | null) => {
    const num = parseFloat(price);
    return `$${num.toLocaleString()}${label ? `/${label}` : "/mo"}`;
  };

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen bg-[#f8f6f3]">
        <div className="container py-12">
          <div className="animate-pulse space-y-6">
            <div className="bg-gray-200 h-8 w-48 rounded" />
            <div className="bg-gray-200 h-[500px] rounded-sm" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-gray-200 h-8 w-3/4 rounded" />
                <div className="bg-gray-200 h-4 w-full rounded" />
                <div className="bg-gray-200 h-4 w-full rounded" />
              </div>
              <div className="bg-gray-200 h-64 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-20 min-h-screen bg-[#f8f6f3] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[#214359] mb-4">Property Not Found</h2>
          <Link href="/properties" className="text-[#86C0C7] hover:underline">
            ← Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  // Support both string[] and { url: string; motionDisabled?: boolean }[]
  const rawGallery = (property.galleryImages as (string | { url: string; motionDisabled?: boolean })[]) || [];
  const normalizedGallery = rawGallery.map((item): { url: string; motionDisabled?: boolean } =>
    typeof item === "string" ? { url: item } : { url: item.url, motionDisabled: item.motionDisabled }
  );
  const urlToMeta = new Map(normalizedGallery.map((g) => [g.url, g.motionDisabled]));
  const orderedUrls = property.mainImageUrl
    ? [property.mainImageUrl, ...normalizedGallery.map((g) => g.url).filter((u) => u !== property.mainImageUrl)]
    : normalizedGallery.map((g) => g.url);
  const images = orderedUrls.map((url) => ({
    url,
    alt: property.title,
    motionDisabled: urlToMeta.get(url),
  }));

  const features = property.features as any;

  return (
    <div className="pt-20 bg-[#f8f6f3] min-h-screen">
      {/* Back link */}
      <div className="bg-white border-b border-border">
        <div className="container py-4">
          <Link href="/properties" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#214359] transition-colors">
            <ArrowLeft size={16} />
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="container py-8">
        {/* Photo Gallery */}
        <PhotoGallery images={images} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Price */}
            <div className="bg-white rounded-sm p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#86C0C7] text-white text-xs font-medium tracking-wider uppercase px-3 py-1 rounded-sm">
                      For {property.listingType === "sale" ? "Sale" : "Rent"}
                    </span>
                    <span className="bg-[#214359]/10 text-[#214359] text-xs font-medium tracking-wider uppercase px-3 py-1 rounded-sm">
                      {property.propertyType}
                    </span>
                  </div>
                  <h1 className="font-serif text-[#214359] text-2xl sm:text-3xl">{property.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                    <MapPin size={16} />
                    <span>{property.address}, {property.city}, {property.province} {property.postalCode}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-serif text-[#214359] text-3xl font-bold">
                    {formatPrice(property.price, property.priceLabel)}
                  </p>
                  {property.mlsNumber && (
                    <p className="text-xs text-muted-foreground mt-1">MLS# {property.mlsNumber}</p>
                  )}
                </div>
              </div>

              {/* Key Stats */}
              <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border">
                {property.bedrooms && (
                  <div className="flex items-center gap-2">
                    <BedDouble size={20} className="text-[#86C0C7]" />
                    <div>
                      <p className="font-medium text-[#214359]">{property.bedrooms}</p>
                      <p className="text-xs text-muted-foreground">Bedrooms</p>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath size={20} className="text-[#86C0C7]" />
                    <div>
                      <p className="font-medium text-[#214359]">{property.bathrooms}</p>
                      <p className="text-xs text-muted-foreground">Bathrooms</p>
                    </div>
                  </div>
                )}
                {property.area && (
                  <div className="flex items-center gap-2">
                    <Ruler size={20} className="text-[#86C0C7]" />
                    <div>
                      <p className="font-medium text-[#214359]">{property.area} {property.areaUnit || "ft²"}</p>
                      <p className="text-xs text-muted-foreground">Living Area</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  }}
                >
                  <Share2 size={14} className="mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast("Feature coming soon")}>
                  <Heart size={14} className="mr-2" />
                  Save
                </Button>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-sm p-8 shadow-sm">
                <h2 className="font-serif text-[#214359] text-xl mb-4">Description</h2>
                <div className="text-[#214359]/70 leading-relaxed whitespace-pre-line">
                  {property.description}
                </div>
              </div>
            )}

            {/* Room Details Table */}
            {(property.roomDetails as { name: string; level: string; dimensions: string; flooring?: string }[] | null)?.length > 0 && (
              <div className="bg-white rounded-sm p-8 shadow-sm">
                <h2 className="font-serif text-[#214359] text-xl mb-4">Room Details</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-[#214359] uppercase tracking-wider">Room</th>
                        <th className="text-left py-3 px-4 font-medium text-[#214359] uppercase tracking-wider">Level</th>
                        <th className="text-left py-3 px-4 font-medium text-[#214359] uppercase tracking-wider">Dimensions</th>
                        <th className="text-left py-3 px-4 font-medium text-[#214359] uppercase tracking-wider">Flooring</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(property.roomDetails as { name: string; level: string; dimensions: string; flooring?: string }[]).map((room, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-3 px-4 text-[#214359]/80">{room.name}</td>
                          <td className="py-3 px-4 text-[#214359]/80">{room.level}</td>
                          <td className="py-3 px-4 text-[#214359]/80">{room.dimensions}</td>
                          <td className="py-3 px-4 text-[#214359]/80">{room.flooring || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Features */}
            {features && (
              <div className="bg-white rounded-sm p-8 shadow-sm">
                <h2 className="font-serif text-[#214359] text-xl mb-4">Property Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(features.rooms as { name: string; dimensions?: string }[] | undefined)?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-3">Rooms</h3>
                      <ul className="space-y-2">
                        {(features.rooms as { name: string; dimensions?: string }[]).map((room: any, i: number) => (
                          <li key={i} className="text-sm text-[#214359]/70 flex justify-between">
                            <span>{room.name}</span>
                            {room.dimensions && <span className="text-muted-foreground">{room.dimensions}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {features.amenities && features.amenities.length > 0 && (
                    <div>
                      <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-3">Amenities</h3>
                      <ul className="space-y-2">
                        {features.amenities.map((amenity: string, i: number) => (
                          <li key={i} className="text-sm text-[#214359]/70 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#86C0C7] rounded-full" />
                            {amenity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {features.inclusions && features.inclusions.length > 0 && (
                    <div>
                      <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-3">Inclusions</h3>
                      <ul className="space-y-2">
                        {features.inclusions.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-[#214359]/70 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#86C0C7] rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            {property.latitude && property.longitude && (
              <div className="bg-white rounded-sm p-8 shadow-sm">
                <h2 className="font-serif text-[#214359] text-xl mb-4">Location</h2>
                <PropertyMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  title={property.title}
                />
              </div>
            )}

            {/* Inline Inquiry Form */}
            <PropertyInquiryForm propertyId={property.id} propertyTitle={property.title} />
          </div>

          {/* Sidebar — Agent Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-sm p-6 shadow-sm sticky top-28">
              <div className="text-center mb-6">
                <img
                  src={THEODORA_HEADSHOT}
                  alt="Theodora Stavropoulos"
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-[#86C0C7]"
                />
                <h3 className="font-serif text-[#214359] text-lg">Theodora Stavropoulos</h3>
                <p className="text-sm text-muted-foreground">Residential Real Estate Broker</p>
                <p className="text-xs text-muted-foreground mt-1">RE/MAX 3000 Inc.</p>
              </div>

              <div className="space-y-3">
                <a
                  href="tel:5143333000"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#86C0C7] text-white font-medium text-sm tracking-wider uppercase rounded-sm hover:bg-[#6AABB3] transition-colors"
                >
                  <Phone size={16} />
                  514 333-3000
                </a>
                <a
                  href="mailto:Theodora.stavropoulos@remax-quebec.com"
                  className="flex items-center justify-center gap-2 w-full py-3 border border-[#214359] text-[#214359] font-medium text-sm tracking-wider uppercase rounded-sm hover:bg-[#214359] hover:text-white transition-all"
                >
                  <Mail size={16} />
                  Email Me
                </a>
                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 w-full py-3 border border-border text-muted-foreground font-medium text-sm tracking-wider uppercase rounded-sm hover:bg-muted transition-colors"
                >
                  Send Inquiry
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <a
                  href="https://www.remax-quebec.com/en/real-estate-brokers/theodora.stavropoulos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#86C0C7] hover:underline"
                >
                  View RE/MAX Profile →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
