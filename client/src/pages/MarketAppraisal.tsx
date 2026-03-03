import { useState, useRef, useEffect } from "react";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete, type AddressData } from "@/components/AddressAutocomplete";
import { MapView } from "@/components/Map";
import { toast } from "sonner";

type Step = "property" | "contact" | "success";

type Report = {
  address: string;
  city?: string;
  estimatedValue: number;
  usedRegionalFallback?: boolean;
  comparablesBlurred: { addressBlurred: string; priceBlurred: string; bedrooms: number | null; bathrooms: number | null; status: string }[];
  comparablesCount: number;
};

const MONTREAL_CENTER = { lat: 45.5017, lng: -73.5673 };

export default function MarketAppraisal() {
  const [step, setStep] = useState<Step>("property");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
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
      if (data.report) setReport(data.report);
      setStep("success");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.name.trim() || !contact.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/book-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed to submit. Please try again.");
        return;
      }
      toast.success(data?.message || "We'll be in touch to schedule your meeting!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    const valueStr = report?.estimatedValue
      ? `$${report.estimatedValue.toLocaleString()}`
      : null;
    return (
      <div className="pt-20">
        <PageHero
          label="PROPERTY EVALUATION"
          title="Thank You!"
          subtitle="Your evaluation has been sent to your email. Below is a preview with blurred comparables."
        />
        <section className="py-24 bg-white">
          <div className="container max-w-2xl space-y-12">
            {report && (
              <>
                <div className="rounded-xl bg-[#214359]/5 p-6">
                  <p className="text-xs text-[#214359]/70 uppercase tracking-wider">Property</p>
                  <p className="text-[#214359] font-semibold text-lg mt-1">
                    {report.address}
                    {report.city && `, ${report.city}`}
                  </p>
                  <p className="text-sm text-[#214359]/70 mt-2">Estimated Market Value</p>
                  <p className="text-2xl font-bold text-[#214359] mt-1">{valueStr ?? "—"}</p>
                  {report.usedRegionalFallback && (
                    <p className="text-xs text-[#214359]/60 mt-2">
                      Based on regional market statistics. Book a meeting for a detailed comparative market analysis.
                    </p>
                  )}
                </div>

                {report.comparablesBlurred && report.comparablesBlurred.length > 0 && (
                  <div>
                    <h3 className="text-[#214359] font-semibold mb-3">Comparable Properties (Preview)</h3>
                    <p className="text-sm text-[#214359]/70 mb-4">
                      We found {report.comparablesCount} comparable propert{report.comparablesCount === 1 ? "y" : "ies"} in your area.
                      <strong> Book a meeting</strong> to unlock full addresses and sale prices.
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-[#214359]/10">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#214359]/5">
                            <th className="text-left p-3 text-[#214359]">Address</th>
                            <th className="text-right p-3 text-[#214359]">Price</th>
                            <th className="p-3 text-[#214359]">Beds</th>
                            <th className="p-3 text-[#214359]">Baths</th>
                            <th className="p-3 text-[#214359]">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.comparablesBlurred.map((c, i) => (
                            <tr key={i} className="border-t border-[#214359]/10">
                              <td className="p-3 text-[#214359]/70">{c.addressBlurred}</td>
                              <td className="p-3 text-right text-[#214359]/70">{c.priceBlurred}</td>
                              <td className="p-3">{c.bedrooms ?? "—"}</td>
                              <td className="p-3">{c.bathrooms ?? "—"}</td>
                              <td className="p-3">{c.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border-2 border-[#86C0C7]/50 bg-[#86C0C7]/5 p-6">
                  <h3 className="text-[#214359] font-semibold text-lg mb-2">Unlock Full Comparables</h3>
                  <p className="text-sm text-[#214359]/80 mb-6">
                    Book a meeting to receive your full comparative market analysis with detailed addresses and sale prices.
                  </p>
                  <form onSubmit={handleBookMeeting} className="space-y-4">
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
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white h-12 uppercase tracking-wider"
                    >
                      {loading ? "Submitting…" : "Book a Meeting"}
                    </Button>
                  </form>
                </div>
              </>
            )}

            <div className="text-center">
              <Button
                variant="outline"
                className="border-[#214359] text-[#214359] hover:bg-[#214359]/5"
                onClick={() => {
                  setStep("property");
                  setReport(null);
                  setPropertyDetails({ address: "", city: "", bedrooms: "", bathrooms: "", propertyType: "house" });
                  setMapCenter(null);
                  setContact({ name: "", email: "", phone: "" });
                }}
              >
                Request Another Evaluation
              </Button>
            </div>
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
                Enter your contact details to receive your evaluation by email. We'll send you an instant estimate plus a preview of comparable properties. Book a meeting to unlock full details.
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
