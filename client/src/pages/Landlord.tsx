import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { Key, TrendingUp, ArrowRight } from "lucide-react";

export default function Landlord() {
  const services = [
    { icon: Key, title: "Recently Leased", description: "See our recently leased properties.", href: "/recently-leased" },
    { icon: TrendingUp, title: "Rental Appraisal", description: "Get a free rental appraisal.", href: "/rental-appraisal" },
  ];

  return (
    <div className="pt-20">
      <PageHero label="LANDLORD" title="Landlord Services" />
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {services.map((s) => (
              <Link key={s.href} href={s.href} className="group block p-8 border border-[#E8F4F4] rounded-sm hover:border-[#86C0C7] hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-[#86C0C7]/10 rounded-full flex items-center justify-center mb-6">
                  <s.icon className="w-7 h-7 text-[#86C0C7]" />
                </div>
                <h3 className="font-serif text-[#214359] text-xl mb-4">{s.title}</h3>
                <p className="text-[#214359]/70 mb-6">{s.description}</p>
                <span className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm">Learn More <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
