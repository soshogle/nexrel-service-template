import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { Building2, ArrowRight } from "lucide-react";

export default function Commercial() {
  return (
    <div className="pt-20">
      <PageHero label="COMMERCIAL" title="Commercial Real Estate" subtitle="Office, retail, and industrial properties. Lease or buy." />
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Link href="/commercial-lease" className="group block p-8 border border-[#E8F4F4] rounded-sm hover:border-[#86C0C7] hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-[#86C0C7]/10 rounded-full flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-[#86C0C7]" />
              </div>
              <h3 className="font-serif text-[#214359] text-xl mb-4">For Lease</h3>
              <p className="text-[#214359]/70 mb-6">Commercial spaces available for lease.</p>
              <span className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm">View Listings <ArrowRight size={14} /></span>
            </Link>
            <Link href="/commercial-sale" className="group block p-8 border border-[#E8F4F4] rounded-sm hover:border-[#86C0C7] hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-[#86C0C7]/10 rounded-full flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-[#86C0C7]" />
              </div>
              <h3 className="font-serif text-[#214359] text-xl mb-4">For Sale</h3>
              <p className="text-[#214359]/70 mb-6">Commercial properties for sale.</p>
              <span className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm">View Listings <ArrowRight size={14} /></span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
