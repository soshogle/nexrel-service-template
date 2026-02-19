import { PageHero } from "@/components/PageHero";

export default function Blog() {
  return (
    <div className="pt-20">
      <PageHero label="BLOG" title="Blog" />
      <section className="py-24 bg-white">
        <div className="container max-w-3xl text-center">
          <p className="text-[#214359]/70">Blog posts coming soon.</p>
        </div>
      </section>
    </div>
  );
}
