import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { Home, Key, TrendingUp, BarChart3, ArrowRight } from "lucide-react";
import { useAgencyConfig } from "@/contexts/AgencyConfigContext";
import { useTranslation } from "react-i18next";

const safeStr = (v: unknown, fallback = ""): string => {
  if (v == null) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
};

export default function Selling() {
  const { t } = useTranslation();
  const { pageLabels } = useAgencyConfig();
  const services = [
    { icon: Home, title: safeStr(pageLabels?.forSale ?? t("common.forSale")), description: String(t("buying.forSaleDesc")), href: "/for-sale" },
    { icon: Key, title: String(t("selling.soldProperties")), description: String(t("selling.soldDesc")), href: "/sold" },
    { icon: TrendingUp, title: String(t("selling.propertyConcierge")), description: String(t("selling.conciergeDesc")), href: "/property-concierge" },
    { icon: BarChart3, title: String(t("selling.marketAppraisal")), description: String(t("selling.appraisalDesc")), href: "/market-appraisal" },
  ];

  return (
    <div className="pt-20">
      <PageHero
        label={safeStr(pageLabels?.selling ?? t("nav.selling")).toUpperCase()}
        title={String(t("selling.title"))}
        subtitle={String(t("selling.subtitle"))}
      />
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {services.map((s) => (
              <Link key={s.href} href={s.href} className="group block p-8 border border-[#E8F4F4] rounded-sm hover:border-[#86C0C7] hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-[#86C0C7]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#86C0C7]/20 transition-colors">
                  <s.icon className="w-7 h-7 text-[#86C0C7]" />
                </div>
                <h3 className="font-serif text-[#214359] text-xl mb-4">{safeStr(s.title)}</h3>
                <p className="text-[#214359]/70 mb-6">{safeStr(s.description)}</p>
                <span className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm group-hover:gap-3 transition-all">
                  {String(t("common.learnMore"))}
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
