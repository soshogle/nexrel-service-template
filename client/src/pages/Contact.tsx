import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapView } from "@/components/Map";
import { toast } from "sonner";

function ContactMap() {
  const handleMapReady = (map: google.maps.Map) => {
    const position = { lat: 45.5310, lng: -73.6535 };
    new google.maps.Marker({
      position,
      map,
      title: "RE/MAX 3000 Inc.",
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
        initialCenter={{ lat: 45.5310, lng: -73.6535 }}
        initialZoom={15}
      />
    </div>
  );
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyOfInterest: "none",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: properties } = trpc.properties.list.useQuery({ limit: 50 });
  const propertyOptions = properties?.items ?? [];

  const submitInquiry = trpc.inquiries.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", propertyOfInterest: "none", message: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const propertyId = formData.propertyOfInterest && formData.propertyOfInterest !== "none"
      ? parseInt(formData.propertyOfInterest, 10)
      : undefined;
    const messageText = formData.propertyOfInterest && formData.propertyOfInterest !== "none"
      ? `Property of interest: ${propertyOptions.find((p) => p.id.toString() === formData.propertyOfInterest)?.title || ""}\n\n${formData.message}`
      : formData.message;
    submitInquiry.mutate({
      propertyId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      message: messageText,
    });
  };

  if (submitted) {
    return (
      <div className="pt-20 min-h-screen bg-[#f8f6f3]">
        <section className="bg-[#214359] py-20">
          <div className="container text-center">
            <p className="text-[#86C0C7] text-sm font-medium tracking-[0.3em] uppercase mb-4">
              Thank You
            </p>
            <h1 className="font-serif text-white text-4xl sm:text-5xl">Message Sent</h1>
            <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
          </div>
        </section>
        <section className="py-24">
          <div className="container max-w-lg text-center">
            <CheckCircle size={64} className="text-[#86C0C7] mx-auto mb-6" />
            <h2 className="font-serif text-[#214359] text-2xl mb-4">Your inquiry has been received</h2>
            <p className="text-[#214359]/70 leading-relaxed mb-8">
              Thank you for reaching out. I'll review your message and get back to you as soon as possible,
              typically within 24 hours.
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              className="bg-[#86C0C7] hover:bg-[#6AABB3] text-white tracking-wider uppercase text-sm px-8 py-3"
            >
              Send Another Message
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-20">
      {/* Page Header */}
      <section className="bg-[#214359] py-20">
        <div className="container text-center">
          <p className="text-[#86C0C7] text-sm font-medium tracking-[0.3em] uppercase mb-4">
            Let's Connect
          </p>
          <h1 className="font-serif text-white text-4xl sm:text-5xl">Contact</h1>
          <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="font-serif text-[#214359] text-2xl mb-2">Send a Message</h2>
              <p className="text-[#214359]/60 mb-8">
                Have a question about a property or looking to buy, sell, or rent? I'd love to hear from you.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    Full Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-12"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-12"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(514) 000-0000"
                    className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-12"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    Property of Interest
                  </label>
                  <Select
                    value={formData.propertyOfInterest}
                    onValueChange={(v) => setFormData({ ...formData, propertyOfInterest: v })}
                  >
                    <SelectTrigger className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-12">
                      <SelectValue placeholder="Select a property (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General inquiry</SelectItem>
                      {propertyOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.title} — ${parseFloat(p.price).toLocaleString()}{p.priceLabel ? `/${p.priceLabel}` : "/mo"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    Message *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell me about what you're looking for..."
                    rows={6}
                    className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm resize-none"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitInquiry.isPending}
                  className="w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white tracking-wider uppercase text-sm py-4 h-auto rounded-sm"
                >
                  {submitInquiry.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="font-serif text-[#214359] text-2xl mb-2">Get in Touch</h2>
              <p className="text-[#214359]/60 mb-8">
                Feel free to reach out directly or visit the office.
              </p>

              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4 p-5 bg-[#f8f6f3] rounded-sm">
                  <div className="w-12 h-12 bg-[#86C0C7]/10 rounded-full flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-[#86C0C7]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-1">Phone</h3>
                    <a href="tel:5143333000" className="text-[#214359]/70 hover:text-[#86C0C7] transition-colors">
                      514 333-3000
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-[#f8f6f3] rounded-sm">
                  <div className="w-12 h-12 bg-[#86C0C7]/10 rounded-full flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-[#86C0C7]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-1">Email</h3>
                    <a href="mailto:Theodora.stavropoulos@remax-quebec.com" className="text-[#214359]/70 hover:text-[#86C0C7] transition-colors">
                      Theodora.stavropoulos@remax-quebec.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-[#f8f6f3] rounded-sm">
                  <div className="w-12 h-12 bg-[#86C0C7]/10 rounded-full flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-[#86C0C7]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-1">Office</h3>
                    <p className="text-[#214359]/70">
                      RE/MAX 3000 Inc.<br />
                      9280 boul. L'Acadie<br />
                      Montréal, QC H4N 3C5
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-[#f8f6f3] rounded-sm">
                  <div className="w-12 h-12 bg-[#86C0C7]/10 rounded-full flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-[#86C0C7]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-1">Hours</h3>
                    <p className="text-[#214359]/70">
                      Monday – Friday: 9:00 AM – 6:00 PM<br />
                      Saturday: 10:00 AM – 4:00 PM<br />
                      Sunday: By Appointment
                    </p>
                  </div>
                </div>
              </div>

              {/* Map */}
              <ContactMap />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
