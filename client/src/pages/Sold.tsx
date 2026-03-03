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

  const safeStr = (v: unknown, fallback = ""): string => {
    if (v == null) return fallback;
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return fallback;
  };

  return (
    <div className="pt-20">
      <PageHero
        label={String(t("sold.label"))}
        title={String(t("sold.title"))}
        subtitle={String(t("sold.subtitle"))}
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
                    <img src={safeStr(p.mainImageUrl, "/placeholder.jpg")} alt={safeStr(p.title, "Property")} className="listing-img-zoom w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-[#214359] text-white px-3 py-1 text-sm font-medium uppercase">{String(t("common.sold"))}</div>
                  </div>
                  <div className="p-4">
                    <p className="font-serif text-[#214359] text-lg">${parseFloat(safeStr(p.price, "0")).toLocaleString()}</p>
                    <p className="text-muted-foreground text-sm">{safeStr(p.address)}{safeStr(p.city) ? `, ${safeStr(p.city)}` : ""}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#214359]/70 text-lg">{String(t("sold.noSold"))}</p>
              <Link href="/properties" className="inline-flex items-center gap-2 mt-6 text-[#86C0C7] font-medium tracking-wider uppercase text-sm">
                {String(t("sold.viewCurrent"))}
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
