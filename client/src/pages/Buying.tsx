import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { Home, Gem, Lock, ArrowRight } from "lucide-react";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";

export default function Buying() {
  const { pageLabels } = useAgencyConfig();
  const services = [
    { icon: Home, title: pageLabels.forSale ?? "For Sale", description: "Browse current listings for sale from Centris — Montreal's largest real estate platform.", href: "/for-sale" },
    { icon: Gem, title: pageLabels.prestige ?? "Prestige Properties", description: "Exclusive luxury and high-end properties.", href: "/prestige" },
    { icon: Lock, title: pageLabels.secretProperties ?? "Secret Properties", description: "Be the first to know about off-market listings.", href: "/secret-properties" },
  ];

  return (
    <div className="pt-20">
      <PageHero label={(pageLabels.buying ?? "Buying").toUpperCase()} title="Find Your Dream Home" subtitle="Whether you're looking for your first home or a prestige property, we're here to help." />
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {services.map((s) => (
              <Link key={s.href} href={s.href} className="group block p-8 border border-[#E8F4F4] rounded-sm hover:border-[#86C0C7] hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-[#86C0C7]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#86C0C7]/20 transition-colors">
                  <s.icon className="w-7 h-7 text-[#86C0C7]" />
                </div>
                <h3 className="font-serif text-[#214359] text-xl mb-4">{s.title}</h3>
                <p className="text-[#214359]/70 mb-6">{s.description}</p>
                <span className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm group-hover:gap-3 transition-all">
                  Explore <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
