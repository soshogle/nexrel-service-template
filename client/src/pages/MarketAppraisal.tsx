import { useState, useRef, useEffect } from "react";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete, type AddressData } from "@/components/AddressAutocomplete";
import { MapView } from "@/components/Map";
import { toast } from "sonner";

type Step = "property" | "contact" | "success";

const MONTREAL_CENTER = { lat: 45.5017, lng: -73.5673 };

export default function MarketAppraisal() {
  const [step, setStep] = useState<Step>("property");
  const [loading, setLoading] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState({
    address: "",
    city: "",
    bedrooms: "",
    bathrooms: "",
    propertyType: "house",
  });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleAddressChange = (value: string, data?: AddressData) => {
    setPropertyDetails((prev) => ({
      ...prev,
      address: value,
      city: data?.city ?? prev.city,
    }));
    if (data?.lat != null && data?.lng != null) {
      setMapCenter({ lat: data.lat, lng: data.lng });
    }
  };

  const handlePropertyNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyDetails.address.trim()) {
      toast.error("Please enter the property address.");
      return;
    }
    setStep("contact");
  };

  useEffect(() => {
    if (!mapCenter || !mapRef.current) return;
    mapRef.current.setCenter(mapCenter);
    mapRef.current.setZoom(16);
    if (typeof google !== "undefined" && google.maps?.marker?.AdvancedMarkerElement) {
      if (markerRef.current) markerRef.current.map = null;
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: mapCenter,
        title: propertyDetails.address,
      });
    }
  }, [mapCenter, propertyDetails.address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.name.trim() || !contact.email.trim()) {
      toast.error("Name and email are required to receive your evaluation.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/property-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyDetails: {
            address: propertyDetails.address.trim(),
            city: propertyDetails.city.trim() || undefined,
            bedrooms: propertyDetails.bedrooms ? parseInt(propertyDetails.bedrooms, 10) : undefined,
            bathrooms: propertyDetails.bathrooms ? parseFloat(propertyDetails.bathrooms) : undefined,
            propertyType: propertyDetails.propertyType || "house",
          },
          contact: {
            name: contact.name.trim(),
            email: contact.email.trim(),
            phone: contact.phone.trim() || undefined,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.error ||
          (res.status === 404
            ? "This service is not configured. Please contact the site owner."
            : res.status === 503
              ? "Service temporarily unavailable. Please try again later."
              : "Evaluation failed. Please try again.");
        toast.error(msg);
        return;
      }
      setStep("success");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="pt-20">
        <PageHero
          label="PROPERTY EVALUATION"
          title="Thank You!"
          subtitle="Your property evaluation has been sent to your email. Check your inbox for the full report with comparable properties."
        />
        <section className="py-24 bg-white">
          <div className="container max-w-xl text-center">
            <p className="text-[#214359] mb-6">
              We've also shared your contact details with our team. A specialist may reach out to discuss a detailed, in-person appraisal if you're interested.
            </p>
            <Button
              variant="outline"
              className="border-[#214359] text-[#214359] hover:bg-[#214359]/5"
              onClick={() => {
                setStep("property");
                setPropertyDetails({ address: "", city: "", bedrooms: "", bathrooms: "", propertyType: "house" });
                setMapCenter(null);
                setContact({ name: "", email: "", phone: "" });
              }}
            >
              Request Another Evaluation
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <PageHero
        label="PROPERTY EVALUATION"
        title="Free Property Appraisal"
        subtitle="Get an instant market estimate based on comparable sales in your area. Enter your property details below."
      />
      <section className="py-24 bg-white">
        <div className="container max-w-xl">
          {step === "property" ? (
            <form onSubmit={handlePropertyNext} className="space-y-6">
              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Property Address *</label>
                <AddressAutocomplete
                  value={propertyDetails.address}
                  onChange={handleAddressChange}
                  placeholder="Search address (e.g. 123 Main St, Montreal)"
                />
              </div>
              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">City</label>
                <Input
                  value={propertyDetails.city}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, city: e.target.value })}
                  placeholder="Montreal"
                  className="border-[#214359]/20 h-12"
                />
              </div>
              <div className="rounded-lg overflow-hidden border border-[#214359]/10">
                <MapView
                  initialCenter={mapCenter ?? MONTREAL_CENTER}
                  initialZoom={mapCenter ? 16 : 11}
                  onMapReady={(map) => {
                    mapRef.current = map;
                    if (mapCenter) {
                      map.setCenter(mapCenter);
                      if (typeof google !== "undefined" && google.maps?.marker?.AdvancedMarkerElement) {
                        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
                          map,
                          position: mapCenter,
                          title: propertyDetails.address,
                        });
                      }
                    }
                  }}
                  className="h-[280px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Bedrooms</label>
                  <Input
                    type="number"
                    min={0}
                    value={propertyDetails.bedrooms}
                    onChange={(e) => setPropertyDetails({ ...propertyDetails, bedrooms: e.target.value })}
                    placeholder="3"
                    className="border-[#214359]/20 h-12"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Bathrooms</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={propertyDetails.bathrooms}
                    onChange={(e) => setPropertyDetails({ ...propertyDetails, bathrooms: e.target.value })}
                    placeholder="2"
                    className="border-[#214359]/20 h-12"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Property Type</label>
                <select
                  value={propertyDetails.propertyType}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, propertyType: e.target.value })}
                  className="w-full h-12 border border-[#214359]/20 rounded-md px-3 text-[#214359] bg-white"
                >
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="apartment">Apartment</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white h-12 uppercase tracking-wider">
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-[#214359]/80 mb-4">
                Enter your contact details to receive your evaluation by email. We'll send you an instant estimate plus comparable properties.
              </p>
              <div className="rounded-lg bg-[#214359]/5 p-4 mb-6">
                <p className="text-xs text-[#214359]/70 uppercase tracking-wider">Property</p>
                <p className="text-[#214359] font-medium">{propertyDetails.address}</p>
                {(propertyDetails.bedrooms || propertyDetails.bathrooms) && (
                  <p className="text-sm text-[#214359]/70 mt-1">
                    {propertyDetails.bedrooms && `${propertyDetails.bedrooms} bed`}
                    {propertyDetails.bedrooms && propertyDetails.bathrooms && " · "}
                    {propertyDetails.bathrooms && `${propertyDetails.bathrooms} bath`}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Name *</label>
                <Input
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="Your name"
                  className="border-[#214359]/20 h-12"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Email *</label>
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="your@email.com"
                  className="border-[#214359]/20 h-12"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Phone</label>
                <Input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="(514) 000-0000"
                  className="border-[#214359]/20 h-12"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-[#214359]/20 text-[#214359]"
                  onClick={() => setStep("property")}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#86C0C7] hover:bg-[#6AABB3] text-white h-12 uppercase tracking-wider"
                >
                  {loading ? "Sending…" : "Get My Evaluation"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
