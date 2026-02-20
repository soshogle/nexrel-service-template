import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PageHero } from "@/components/PageHero";
import { MapPin, BedDouble, Bath, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Sold() {
  const { t } = useTranslation();
  const { data, isLoading } = trpc.properties.list.useQuery({
    status: "sold",
    limit: 20,
  });
  const properties = data?.items ?? [];

  return (
    <div className="pt-20">
      <PageHero
        label={t("sold.label")}
        title={t("sold.title")}
        subtitle={t("sold.subtitle")}
      />
      <section className="py-24 bg-[#f8f6f3]">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-56 rounded-sm" />
                  <div className="mt-4 space-y-2">
                    <div className="bg-gray-200 h-4 w-3/4 rounded" />
                    <div className="bg-gray-200 h-4 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((p) => (
                <Link key={p.id} href={`/property/${p.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-sm aspect-[4/3]">
                    <img src={p.mainImageUrl || "/placeholder.jpg"} alt={p.title} className="listing-img-zoom w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-[#214359] text-white px-3 py-1 text-sm font-medium uppercase">{t("common.sold")}</div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="font-serif text-white text-lg">${parseFloat(p.price).toLocaleString()}</p>
                      <p className="text-white/80 text-sm">{p.address}, {p.city}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#214359]/70 text-lg">{t("sold.noSold")}</p>
              <Link href="/properties" className="inline-flex items-center gap-2 mt-6 text-[#86C0C7] font-medium tracking-wider uppercase text-sm">
                {t("sold.viewCurrent")}
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
