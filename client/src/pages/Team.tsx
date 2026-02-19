import { trpc } from "@/lib/trpc";
import { PageHero } from "@/components/PageHero";
import { Link } from "wouter";
import { Mail, Phone } from "lucide-react";

export default function Team() {
  const { data: team, isLoading } = trpc.team.list.useQuery();
  const { data: broker } = trpc.broker.getProfile.useQuery();

  const members = (team && team.length > 0) ? team : (broker ? [{
    id: 0,
    name: broker.name,
    title: broker.title,
    photoUrl: broker.photoUrl,
    bio: broker.bio,
    email: broker.email,
    phone: broker.phone,
  }] : []);

  return (
    <div className="pt-20">
      <PageHero label="TEAM" title="Our Team" subtitle="Meet the people behind our success. Experienced, dedicated, and here to help." />
      <section className="py-24 bg-white">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[3/4] rounded-sm" />
                  <div className="mt-4 space-y-2">
                    <div className="bg-gray-200 h-5 w-1/2 rounded" />
                    <div className="bg-gray-200 h-4 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {members.map((m: any) => (
                <div key={m.id} className="text-center">
                  <div className="relative overflow-hidden rounded-sm aspect-[3/4] mb-6">
                    <img
                      src={m.photoUrl || "/placeholder-agent.jpg"}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-serif text-[#214359] text-xl mb-1">{m.name}</h3>
                  <p className="text-[#86C0C7] text-sm tracking-wider uppercase mb-4">{m.title}</p>
                  {m.bio && <p className="text-[#214359]/70 text-sm mb-4 line-clamp-3">{m.bio}</p>}
                  <div className="flex justify-center gap-4">
                    {m.email && (
                      <a href={`mailto:${m.email}`} className="text-[#86C0C7] hover:text-[#214359] transition-colors">
                        <Mail size={18} />
                      </a>
                    )}
                    {m.phone && (
                      <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="text-[#86C0C7] hover:text-[#214359] transition-colors">
                        <Phone size={18} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#214359]/70">Team information coming soon.</p>
              <Link href="/contact" className="inline-block mt-6 text-[#86C0C7] font-medium tracking-wider uppercase text-sm">
                Get in Touch
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
