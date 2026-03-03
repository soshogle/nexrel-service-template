interface PageHeroProps {
  label?: string;
  title: string;
  subtitle?: string;
}

const safeStr = (v: unknown, fallback = ""): string => {
  if (v == null) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
};

export function PageHero({ label, title, subtitle }: PageHeroProps) {
  return (
    <section className="bg-[#214359] py-20">
      <div className="container text-center">
        {label && (
          <p className="text-[#86C0C7] text-sm font-medium tracking-[0.2em] uppercase mb-4">
            {safeStr(label)}
          </p>
        )}
        <h1 className="font-serif text-white text-4xl sm:text-5xl">{safeStr(title)}</h1>
        {subtitle && (
          <p className="text-white/70 mt-4 max-w-2xl mx-auto">{safeStr(subtitle)}</p>
        )}
        <div className="w-16 h-0.5 bg-[#86C0C7] mx-auto mt-6" />
      </div>
    </section>
  );
}
