import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapView } from "@/components/Map";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      toast.error(error.message || t("propertyDetail.failedToSend"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t("propertyDetail.fillRequired"));
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
              {t("contact.thankYou")}
            </p>
            <h1 className="font-serif text-white text-4xl sm:text-5xl">{t("contact.messageSent")}</h1>
            <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
          </div>
        </section>
        <section className="py-24">
          <div className="container max-w-lg text-center">
            <CheckCircle size={64} className="text-[#86C0C7] mx-auto mb-6" />
            <h2 className="font-serif text-[#214359] text-2xl mb-4">{t("contact.inquiryReceived")}</h2>
            <p className="text-[#214359]/70 leading-relaxed mb-8">
              {t("contact.thankYouDesc")}
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              className="bg-[#86C0C7] hover:bg-[#6AABB3] text-white tracking-wider uppercase text-sm px-8 py-3"
            >
              {t("contact.sendAnother")}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <section className="bg-[#214359] py-20">
        <div className="container text-center">
          <p className="text-[#86C0C7] text-sm font-medium tracking-[0.3em] uppercase mb-4">
            {t("contact.letsConnect")}
          </p>
          <h1 className="font-serif text-white text-4xl sm:text-5xl">{t("contact.contactTitle")}</h1>
          <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="font-serif text-[#214359] text-2xl mb-2">{t("contact.sendAMessage")}</h2>
              <p className="text-[#214359]/60 mb-8">
                {t("contact.formDesc")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    {t("contact.fullName")} *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("propertyDetail.yourName")}
                    className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-12"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    {t("contact.emailAddress")} *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t("propertyDetail.yourEmail")}
                    className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-12"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    {t("contact.phoneNumber")}
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t("propertyDetail.yourPhone")}
                    className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-12"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    {t("contact.propertyOfInterest")}
                  </label>
                  <Select
                    value={formData.propertyOfInterest}
                    onValueChange={(v) => setFormData({ ...formData, propertyOfInterest: v })}
                  >
                    <SelectTrigger className="border-[#214359]/20 focus:border-[#86C0C7] rounded-sm h-12">
                      <SelectValue placeholder={t("contact.selectProperty")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("contact.generalInquiry")}</SelectItem>
                      {propertyOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.title} — ${parseFloat(p.price).toLocaleString()}{p.priceLabel ? `/${p.priceLabel}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">
                    {t("contact.messageLabel")} *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t("contact.messagePlaceholder")}
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
                    t("common.sending")
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      {t("common.sendMessage")}
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div>
              <h2 className="font-serif text-[#214359] text-2xl mb-2">{t("contact.getInTouchTitle")}</h2>
              <p className="text-[#214359]/60 mb-8">
                {t("contact.getInTouchDesc")}
              </p>

              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4 p-5 bg-[#f8f6f3] rounded-sm">
                  <div className="w-12 h-12 bg-[#86C0C7]/10 rounded-full flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-[#86C0C7]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-1">{t("common.phone")}</h3>
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
                    <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-1">{t("common.email")}</h3>
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
                    <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-1">{t("common.office")}</h3>
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
                    <h3 className="font-medium text-[#214359] text-sm uppercase tracking-wider mb-1">{t("common.hours")}</h3>
                    <p className="text-[#214359]/70">
                      {t("contact.hours.weekday")}<br />
                      {t("contact.hours.saturday")}<br />
                      {t("contact.hours.sunday")}
                    </p>
                  </div>
                </div>
              </div>

              <ContactMap />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
