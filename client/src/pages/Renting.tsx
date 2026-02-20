import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { Home, ArrowRight } from "lucide-react";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";
import { useTranslation } from "react-i18next";

export default function Renting() {
  const { t } = useTranslation();
  const { pageLabels } = useAgencyConfig();
  const services = [
    { icon: Home, title: pageLabels.forLease ?? t("common.forLease"), description: t("renting.forLeaseDesc"), href: "/for-lease" },
  ];

  return (
    <div className="pt-20">
      <PageHero label={(pageLabels.renting ?? t("nav.renting")).toUpperCase()} title={t("renting.title")} subtitle={t("renting.subtitle")} />
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-2xl mx-auto">
            {services.map((s) => (
              <Link key={s.href} href={s.href} className="group block p-8 border border-[#E8F4F4] rounded-sm hover:border-[#86C0C7] hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-[#86C0C7]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#86C0C7]/20 transition-colors">
                  <s.icon className="w-7 h-7 text-[#86C0C7]" />
                </div>
                <h3 className="font-serif text-[#214359] text-xl mb-4">{s.title}</h3>
                <p className="text-[#214359]/70 mb-6">{s.description}</p>
                <span className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm group-hover:gap-3 transition-all">
                  {t("common.learnMore")} <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
