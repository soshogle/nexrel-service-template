import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { Home, Key, TrendingUp, BarChart3, ArrowRight } from "lucide-react";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";

export default function Selling() {
  const { pageLabels } = useAgencyConfig();
  const services = [
    {
      icon: Home,
      title: pageLabels.forSale ?? "For Sale",
      description: "Browse current listings for sale from Centris — Montreal's largest real estate platform.",
      href: "/for-sale",
    },
    {
      icon: Key,
      title: "Sold Properties",
      description: "Browse our recently sold properties and see what we've achieved for our clients.",
      href: "/sold",
    },
    {
      icon: TrendingUp,
      title: "Property Concierge",
      description: "Talk to our AI assistant — ask about listings, schedule viewings, or get answers.",
      href: "/property-concierge",
    },
    {
      icon: BarChart3,
      title: "Market Appraisal",
      description: "Get a free, no-obligation market appraisal of your property's value.",
      href: "/market-appraisal",
    },
  ];

  return (
    <div className="pt-20">
      <PageHero
        label={(pageLabels.selling ?? "Selling").toUpperCase()}
        title="Sell Your Property"
        subtitle="We bring expertise, market knowledge, and a proven track record to help you achieve the best result."
      />
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {services.map((s) => (
              <Link key={s.href} href={s.href} className="group block p-8 border border-[#E8F4F4] rounded-sm hover:border-[#86C0C7] hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-[#86C0C7]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#86C0C7]/20 transition-colors">
                  <s.icon className="w-7 h-7 text-[#86C0C7]" />
                </div>
                <h3 className="font-serif text-[#214359] text-xl mb-4">{s.title}</h3>
                <p className="text-[#214359]/70 mb-6">{s.description}</p>
                <span className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm group-hover:gap-3 transition-all">
                  Learn More
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
