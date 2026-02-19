import { trpc } from "@/lib/trpc";
import { PageHero } from "@/components/PageHero";
import { Link } from "wouter";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";

export default function Careers() {
  const { data: jobs } = trpc.careers.list.useQuery();

  return (
    <div className="pt-20">
      <PageHero label="CAREERS" title="Join Our Team" subtitle="We're always looking for talented individuals." />
      <section className="py-24 bg-white">
        <div className="container max-w-3xl">
          {jobs && jobs.length > 0 ? (
            <div className="space-y-6">
              {jobs.map((job: any) => (
                <div key={job.id} className="p-8 border border-[#E8F4F4] rounded-sm hover:border-[#86C0C7] transition-colors">
                  <h3 className="font-serif text-[#214359] text-xl mb-2">{job.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-[#214359]/70 mb-4">
                    {job.department && <span className="flex items-center gap-1"><Briefcase size={14} />{job.department}</span>}
                    {job.location && <span className="flex items-center gap-1"><MapPin size={14} />{job.location}</span>}
                  </div>
                  {job.description && <p className="text-[#214359]/80 mb-6 line-clamp-3">{job.description}</p>}
                  <Link href="/contact" className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm">Apply Now <ArrowRight size={14} /></Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#214359]/70 mb-6">No open positions at the moment. We're always interested in hearing from talented people.</p>
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-[#86C0C7] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#6AABB3] transition-colors">Send Your Resume <ArrowRight size={16} /></Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
