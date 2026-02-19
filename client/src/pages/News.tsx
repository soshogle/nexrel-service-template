import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { FileText, Video, Mic, Quote, Award, ArrowRight } from "lucide-react";

const sections = [
  { icon: FileText, title: "Blog", href: "/blog" },
  { icon: Video, title: "Videos", href: "/videos" },
  { icon: Mic, title: "Podcasts", href: "/podcasts" },
  { icon: Quote, title: "Testimonials", href: "/testimonials" },
  { icon: Award, title: "Awards", href: "/awards" },
];

export default function News() {
  return (
    <div className="pt-20">
      <PageHero label="NEWS & MEDIA" title="News & Media" />
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((s) => (
              <Link key={s.href} href={s.href} className="group block p-8 border border-[#E8F4F4] rounded-sm hover:border-[#86C0C7] hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-[#86C0C7]/10 rounded-full flex items-center justify-center mb-6">
                  <s.icon className="w-7 h-7 text-[#86C0C7]" />
                </div>
                <h3 className="font-serif text-[#214359] text-xl mb-4">{s.title}</h3>
                <span className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm group-hover:gap-3 transition-all">View <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
