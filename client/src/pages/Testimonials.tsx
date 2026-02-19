import { trpc } from "@/lib/trpc";
import { PageHero } from "@/components/PageHero";
import { Quote } from "lucide-react";

export default function Testimonials() {
  const { data: testimonials, isLoading } = trpc.testimonials.list.useQuery({ limit: 10 });

  const fallback = [
    { quote: "Professional, responsive, and truly cares about finding the right fit. We couldn't have asked for a better experience.", author: "Marie & Jean" },
    { quote: "Made our home-buying journey seamless. Knowledge of the local market is unmatched.", author: "Alex K." },
    { quote: "Exceptional service from start to finish. Highly recommend.", author: "Sarah M." },
  ];

  const items = (testimonials && testimonials.length > 0) ? testimonials : fallback;

  return (
    <div className="pt-20">
      <PageHero label="TESTIMONIALS" title="What Clients Say" subtitle="Hear from people we've helped find their perfect home." />
      <section className="py-24 bg-[#f8f6f3]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((t: any, i: number) => (
              <div key={i} className="p-8 bg-white rounded-sm border border-[#E8F4F4]">
                <Quote className="w-10 h-10 text-[#86C0C7]/50 mb-4" />
                <p className="font-serif text-[#214359] text-lg italic mb-6">"{t.quote}"</p>
                <p className="text-[#214359]/70 text-sm">— {t.author || "Client"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
