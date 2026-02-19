import { Link } from "wouter";
import { MapPin, Phone, Mail, Globe, ArrowRight } from "lucide-react";
import { MapView } from "@/components/Map";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";

const THEODORA_HEADSHOT = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663115065429/FXvMFuJPKwMDlplc.jpeg";

function OfficeMap() {
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

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family:Inter,sans-serif;padding:4px;">
          <h3 style="font-family:'Libre Baskerville',serif;font-size:15px;color:#214359;margin:0 0 4px;">RE/MAX 3000 Inc.</h3>
          <p style="font-size:13px;color:#666;margin:0;">9280 boul. L'Acadie</p>
          <p style="font-size:13px;color:#666;margin:0;">Montréal, QC H4N 3C5</p>
        </div>
      `,
    });
    infoWindow.open(map, new google.maps.Marker({ position, map, visible: false }));
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

export default function AboutPage() {
  const config = useAgencyConfig();
  return (
    <div className="pt-20">
      {/* Page Header */}
      <section className="bg-[#214359] py-20">
        <div className="container text-center">
          <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
            THE TS STORY
          </p>
          <h1 className="font-serif text-white text-4xl sm:text-5xl italic">A broker with true dedication</h1>
          <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
        </div>
      </section>

      {/* Profile Section */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Photo */}
            <div>
              <div className="relative">
                <div className="absolute -bottom-4 -left-4 w-full h-full bg-[#86C0C7]/10 rounded-sm" />
                <img
                  src={THEODORA_HEADSHOT}
                  alt="Theodora Stavropoulos"
                  className="relative w-full rounded-sm shadow-xl object-cover aspect-[3/4]"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <p className="text-[#86C0C7] text-sm font-medium tracking-[0.3em] uppercase mb-4">
                Residential Real Estate Broker
              </p>
              <h2 className="font-serif text-[#214359] text-3xl sm:text-4xl mb-6">
                Theodora Stavropoulos
              </h2>
              <div className="w-16 h-0.5 bg-[#86C0C7] mb-8" />

              <div className="space-y-6 text-[#214359]/70 leading-relaxed">
                <p>
                  As a dedicated Residential Real Estate Broker at RE/MAX 3000 Inc., I bring a passion for
                  helping clients navigate the Montréal real estate market with confidence and ease. Whether
                  you're a first-time buyer, looking to sell, or searching for the perfect rental, I provide
                  personalized service tailored to your unique needs.
                </p>
                <p>
                  Fluent in <strong className="text-[#214359]">English, French, and Greek</strong>, I serve
                  a diverse clientele across Montréal's vibrant neighborhoods. From the artistic energy of
                  Le Plateau-Mont-Royal to the family-friendly streets of Saint-Laurent, I know the city
                  inside and out.
                </p>
                <p>
                  My approach is built on transparency, responsiveness, and genuine care for my clients'
                  goals. I believe that finding the right home is about more than square footage — it's
                  about finding a place where life happens.
                </p>
              </div>

              {/* Contact Info */}
              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#86C0C7]/10 rounded-full flex items-center justify-center">
                    <Phone size={18} className="text-[#86C0C7]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                    <a href="tel:5143333000" className="text-[#214359] font-medium hover:text-[#86C0C7] transition-colors">
                      514 333-3000
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#86C0C7]/10 rounded-full flex items-center justify-center">
                    <Mail size={18} className="text-[#86C0C7]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                    <a href={`mailto:${config.email}`} className="text-[#214359] font-medium hover:text-[#86C0C7] transition-colors">
                      {config.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#86C0C7]/10 rounded-full flex items-center justify-center">
                    <Globe size={18} className="text-[#86C0C7]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Languages</p>
                    <p className="text-[#214359] font-medium">English, French, Greek</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#86C0C7] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#6AABB3] transition-colors duration-300"
                >
                  Get in Touch
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="https://www.remax-quebec.com/en/real-estate-brokers/theodora.stavropoulos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-[#214359] text-[#214359] font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#214359] hover:text-white transition-all duration-300"
                >
                  RE/MAX Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Section */}
      <section className="py-24 bg-[#f8f6f3]">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-[#86C0C7] text-sm font-medium tracking-[0.3em] uppercase mb-4">
              Visit Us
            </p>
            <h2 className="font-serif text-[#214359] text-3xl sm:text-4xl">
              Office Location
            </h2>
            <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="font-serif text-[#214359] text-2xl mb-4">RE/MAX 3000 Inc.</h3>
              <div className="space-y-4 text-[#214359]/70">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#86C0C7] mt-0.5 shrink-0" />
                  <div>
                    <p>9280 boul. L'Acadie</p>
                    <p>Montréal, QC H4N 3C5</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-[#86C0C7] shrink-0" />
                  <a href="tel:5143333000" className="hover:text-[#86C0C7] transition-colors">
                    514 333-3000
                  </a>
                </div>
              </div>
              <p className="mt-6 text-[#214359]/60 text-sm leading-relaxed">
                Located in the heart of Montréal, our office is easily accessible and ready to welcome you.
                Feel free to stop by or schedule an appointment to discuss your real estate needs.
              </p>
            </div>
            <OfficeMap />
          </div>
        </div>
      </section>
    </div>
  );
}
