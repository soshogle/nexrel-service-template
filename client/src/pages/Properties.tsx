import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { usePageContextOptional } from "@/contexts/PageContext";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";
import { trpc } from "@/lib/trpc";
import { MapPin, BedDouble, Bath, Grid3X3, Map as MapIcon, SlidersHorizontal, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapView } from "@/components/Map";

function PropertyCard({ property }: { property: any }) {
  const formatPrice = (price: string, label?: string | null) => {
    const num = parseFloat(price);
    return `$${num.toLocaleString()}${label ? `/${label}` : "/mo"}`;
  };

  return (
    <Link href={`/property/${property.slug}`} className="group property-card block">
      <div className="relative overflow-hidden rounded-sm aspect-[4/3]">
        <img
          src={property.mainImageUrl || "/placeholder.jpg"}
          alt={property.title}
          className="listing-img-zoom w-full h-full object-cover"
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
                <BedDouble size={14} /> {property.bedrooms} Beds
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath size={14} /> {property.bathrooms} Bath
              </span>
            )}
            {property.area && (
              <span>{property.area} {property.areaUnit || "ft²"}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function PropertyMapView({ properties }: { properties: any[] }) {
  const pageCtx = usePageContextOptional();
  const mapRef = useRef<google.maps.Map | null>(null);
  const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    if (propertiesWithCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();

      propertiesWithCoords.forEach((property) => {
        const position = { lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) };
        bounds.extend(position);

        const marker = new google.maps.Marker({
          position,
          map,
          title: property.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#86C0C7",
            fillOpacity: 1,
            strokeColor: "#214359",
            strokeWeight: 2,
            scale: 10,
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
          <div style="max-width:280px;font-family:Inter,sans-serif;">
            <img src="${property.mainImageUrl}" alt="${property.title}" style="width:100%;height:150px;object-fit:cover;border-radius:4px;margin-bottom:8px;" />
            <h3 style="font-family:'Libre Baskerville',serif;font-size:16px;color:#214359;margin:0 0 4px;">${property.title}</h3>
            <p style="font-size:13px;color:#666;margin:0 0 4px;">${property.address}, ${property.city}</p>
            <p style="font-size:16px;font-weight:600;color:#214359;margin:0;">$${parseFloat(property.price).toLocaleString()}${property.priceLabel ? `/${property.priceLabel}` : "/mo"}</p>
            <a href="/property/${property.slug}" style="display:inline-block;margin-top:8px;color:#86C0C7;font-size:13px;text-decoration:none;">View Details →</a>
          </div>
        `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      });

      map.fitBounds(bounds);
      if (propertiesWithCoords.length === 1) {
        map.setZoom(14);
      }
    }
  }, [propertiesWithCoords]);

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl sm:text-3xl text-[#214359] text-center">
        Find Your Dream Home
      </h2>
      <AddressSearchBar
        onAddressSelect={(address, lat, lng) => {
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(15);
          }
          pageCtx?.setPageContext({ searchAddress: address });
          // Auto-connect Voice AI so user can ask the agent what they want in this area
          window.dispatchEvent(new CustomEvent("openVoiceAI", { detail: {} }));
        }}
      />
      <div className="relative rounded-sm overflow-hidden h-[500px]">
        <MapView
          onMapReady={handleMapReady}
          initialCenter={{ lat: 45.5017, lng: -73.5673 }}
          initialZoom={12}
        />
        {propertiesWithCoords.length === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 px-4 py-2 rounded shadow text-sm text-muted-foreground text-center max-w-md">
            No properties with location data. Search an address above, then use the mic to tell the broker what you&apos;re looking for in this area.
          </div>
        )}
      </div>
    </div>
  );
}

/** Address search using Google Places Autocomplete. Pans map and sets page context for Voice AI. */
function AddressSearchBar({ onAddressSelect }: { onAddressSelect: (address: string, lat: number, lng: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!inputRef.current) return;
    const check = () => {
      if (typeof window !== "undefined" && window.google?.maps?.places) {
        if (!autocompleteRef.current && inputRef.current) {
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ["geocode", "establishment"],
            fields: ["formatted_address", "geometry"],
          });
          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current?.getPlace();
            if (!place?.geometry?.location) return;
            const address = place.formatted_address || "";
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            onAddressSelect(address, lat, lng);
          });
        }
        setReady(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    const id = setInterval(() => check(), 200);
    return () => clearInterval(id);
  }, [onAddressSelect]);

  return (
    <div className="relative">
      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={ready ? "Search street or address — then use the mic to tell the broker what you want in this area" : "Loading map..."}
        className="pl-12 h-12 rounded-sm border-[#214359]/20 focus:border-[#86C0C7]"
        autoComplete="off"
      />
    </div>
  );
}

interface PropertiesProps {
  defaultListingType?: "sale" | "rent";
  defaultPropertyType?: string;
  prestige?: boolean;
  pageLabelKey?: string;
  pageLabel?: string;
}

function parseSearchParams(search: string) {
  const params = new URLSearchParams(search);
  return {
    bedrooms: params.get("bedrooms") || "all",
    bathrooms: params.get("bathrooms") || "all",
    city: params.get("city") || "",
    propertyType: params.get("property_type") || "all",
    listingType: params.get("listing_type") || "all",
    minPrice: params.get("min_price") ? parseInt(params.get("min_price")!, 10) : undefined,
    maxPrice: params.get("max_price") ? parseInt(params.get("max_price")!, 10) : undefined,
  };
}

export default function Properties({ defaultListingType, defaultPropertyType, prestige, pageLabelKey, pageLabel = "Properties" }: PropertiesProps = {}) {
  const config = useAgencyConfig();
  const resolvedLabel = pageLabelKey ? (config.pageLabels[pageLabelKey] ?? pageLabel) : pageLabel;
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [propertyType, setPropertyType] = useState<string>(defaultPropertyType || "all");
  const [listingType, setListingType] = useState<string>(defaultListingType || "all");
  const [bedrooms, setBedrooms] = useState<string>("all");
  const [bathrooms, setBathrooms] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [location] = useLocation();

  // Sync filters from URL when Voice AI navigates (e.g. /for-sale?bedrooms=2&city=Saint-Laurent&min_price=400000&max_price=500000)
  const searchString = typeof window !== "undefined" ? window.location.search : "";
  useEffect(() => {
    const parsed = parseSearchParams(searchString);
    if (parsed.bedrooms !== "all") setBedrooms(parsed.bedrooms);
    if (parsed.bathrooms !== "all") setBathrooms(parsed.bathrooms);
    if (parsed.city) setSearch(parsed.city);
    if (parsed.propertyType !== "all") setPropertyType(parsed.propertyType);
    if (parsed.listingType !== "all") setListingType(parsed.listingType);
    else if (defaultListingType && location.includes("for-lease")) setListingType("rent");
    else if (defaultListingType && location.includes("for-sale")) setListingType("sale");
    if (parsed.minPrice != null && !Number.isNaN(parsed.minPrice)) setMinPrice(String(parsed.minPrice));
    if (parsed.maxPrice != null && !Number.isNaN(parsed.maxPrice)) setMaxPrice(String(parsed.maxPrice));
  }, [location, searchString, defaultListingType]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const minPriceNum = minPrice.trim() ? parseInt(minPrice, 10) : undefined;
  const maxPriceNum = maxPrice.trim() ? parseInt(maxPrice, 10) : undefined;

  const { data: propertiesData, isLoading } = trpc.properties.list.useQuery({
    propertyType: propertyType !== "all" ? propertyType : defaultPropertyType || undefined,
    listingType: (listingType !== "all" ? listingType : defaultListingType) as "sale" | "rent" | undefined,
    bedrooms: bedrooms !== "all" ? parseInt(bedrooms) : undefined,
    bathrooms: bathrooms !== "all" ? parseInt(bathrooms) : undefined,
    minPrice: minPriceNum != null && !Number.isNaN(minPriceNum) ? minPriceNum : undefined,
    maxPrice: maxPriceNum != null && !Number.isNaN(maxPriceNum) ? maxPriceNum : undefined,
    search: searchDebounced.trim() || undefined,
    prestige: prestige,
    limit: 50,
    sortBy: sortBy as "price_asc" | "price_desc" | "newest" | "oldest",
  });

  const sortedProperties = propertiesData?.items ?? [];
  const pageCtx = usePageContextOptional();

  // Tell Voice AI what listings are on screen
  useEffect(() => {
    if (!pageCtx) return;
    const pageType = defaultListingType === "rent" ? "listings" : "listings";
    const summaries = sortedProperties.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      address: p.address,
      city: p.city,
      price: p.price,
      priceLabel: p.priceLabel,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      listingType: p.listingType,
    }));
    pageCtx.setPageContext({ path: location, pageType, visibleListings: summaries, selectedListing: null });
  }, [pageCtx, location, sortedProperties, defaultListingType]);

  return (
    <div className="pt-20">
      {/* Page Header */}
      <section className="bg-[#214359] py-20">
        <div className="container text-center">
          <p className="text-[#86C0C7] text-sm font-medium tracking-[0.3em] uppercase mb-4">
            Browse Listings
          </p>
          <h1 className="font-serif text-white text-4xl sm:text-5xl">{resolvedLabel}</h1>
          <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
        </div>
      </section>

      {/* Search bar */}
      <section className="bg-white border-b border-border">
        <div className="container py-4">
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by address, neighborhood, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-sm border-[#214359]/20 focus:border-[#86C0C7]"
            />
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="border-b border-border bg-white sticky top-20 z-40">
        <div className="container py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={filtersOpen ? "bg-[#214359] text-white border-[#214359]" : ""}
            >
              <SlidersHorizontal size={16} className="mr-2" />
              Filters
            </Button>
            <span className="text-sm text-muted-foreground">
              {sortedProperties.length} {sortedProperties.length === 1 ? "property" : "properties"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border border-border rounded-sm overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-[#214359] text-white" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 ${viewMode === "map" ? "bg-[#214359] text-white" : "text-muted-foreground hover:bg-muted"}`}
              >
                <MapIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {filtersOpen && (
          <div className="container pb-4 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={listingType} onValueChange={setListingType}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Listing Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                </SelectContent>
              </Select>

              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Beds</SelectItem>
                  <SelectItem value="1">1+ Bed</SelectItem>
                  <SelectItem value="2">2+ Beds</SelectItem>
                  <SelectItem value="3">3+ Beds</SelectItem>
                  <SelectItem value="4">4+ Beds</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bathrooms} onValueChange={setBathrooms}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Baths</SelectItem>
                  <SelectItem value="1">1+ Bath</SelectItem>
                  <SelectItem value="2">2+ Baths</SelectItem>
                  <SelectItem value="3">3+ Baths</SelectItem>
                  <SelectItem value="4">4+ Baths</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Min price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-[120px] h-9 text-sm"
              />
              <Input
                type="number"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-[120px] h-9 text-sm"
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPropertyType("all");
                  setListingType("all");
                  setBedrooms("all");
                  setBathrooms("all");
                  setMinPrice("");
                  setMaxPrice("");
                  setSearch("");
                }}
                className="text-sm text-muted-foreground"
              >
                <X size={14} className="mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Content */}
      <section className="py-12 bg-[#f8f6f3] min-h-[60vh]">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-72 rounded-sm" />
                  <div className="mt-4 space-y-2">
                    <div className="bg-gray-200 h-4 w-3/4 rounded" />
                    <div className="bg-gray-200 h-4 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === "map" ? (
            <PropertyMapView properties={sortedProperties} />
          ) : sortedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sortedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {searchDebounced || propertyType !== "all" || listingType !== "all" || bedrooms !== "all" || bathrooms !== "all" || minPrice || maxPrice
                  ? "No properties match your filters."
                  : "No listings yet. Listings are synced from Centris.ca. Check back soon."}
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPropertyType("all");
                    setListingType("all");
                    setBedrooms("all");
                    setBathrooms("all");
                    setMinPrice("");
                    setMaxPrice("");
                    setSearch("");
                  }}
                >
                  Clear Filters
                </Button>
                {config?.remaxProfileUrl && (
                  <a
                    href={config.remaxProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2 border border-[#214359]/30 text-[#214359] font-medium rounded-sm hover:bg-[#214359] hover:text-white transition-colors"
                  >
                    View on RE/MAX
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
