interface PageHeroProps {
  label?: string;
  title: string;
  subtitle?: string;
}

export function PageHero({ label, title, subtitle }: PageHeroProps) {
  return (
    <section className="bg-[#214359] py-20">
      <div className="container text-center">
        {label && (
          <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
            {label}
          </p>
        )}
        <h1 className="font-serif text-white text-4xl sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="text-white/70 mt-4 max-w-2xl mx-auto">{subtitle}</p>
        )}
        <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
      </div>
    </section>
  );
}
