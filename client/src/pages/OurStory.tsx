import { trpc } from "@/lib/trpc";
import { PageHero } from "@/components/PageHero";

export default function OurStory() {
  const { data: broker } = trpc.broker.getProfile.useQuery();

  return (
    <div className="pt-20">
      <PageHero label="OUR STORY" title="A broker with true dedication" />
      <section className="py-24 bg-white">
        <div className="container max-w-3xl">
          {broker?.bio ? (
            <p className="text-[#214359]/80 leading-relaxed whitespace-pre-line">{broker.bio}</p>
          ) : (
            <p className="text-[#214359]/80 leading-relaxed">We're a dedicated real estate agency built on trust and expertise.</p>
          )}
        </div>
      </section>
    </div>
  );
}
