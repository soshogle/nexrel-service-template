import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PageHero } from "@/components/PageHero";
import { ArrowRight } from "lucide-react";

export default function RecentlyLeased() {
  const { data, isLoading } = trpc.properties.list.useQuery({ status: "rented", limit: 20 });
  const properties = data?.items ?? [];

  return (
    <div className="pt-20">
      <PageHero label="RECENTLY LEASED" title="Recently Leased" subtitle="Properties we've successfully leased for our landlord clients." />
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
                    <div className="absolute top-4 left-4 bg-[#86C0C7] text-white px-3 py-1 text-sm font-medium uppercase">Leased</div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="font-serif text-white text-lg">${parseFloat(p.price).toLocaleString()}/mo</p>
                      <p className="text-white/80 text-sm">{p.address}, {p.city}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#214359]/70 text-lg">No recently leased properties to display yet.</p>
              <Link href="/for-lease" className="inline-flex items-center gap-2 mt-6 text-[#86C0C7] font-medium tracking-wider uppercase text-sm">
                View Available Rentals
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
