import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
] as const;

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("fr") ? "fr" : "en";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Globe size={14} className="text-white/60" />
      {LANGS.map((lang, i) => (
        <span key={lang.code} className="flex items-center">
          {i > 0 && <span className="text-white/30 mx-0.5">|</span>}
          <button
            type="button"
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`text-xs font-medium tracking-wider uppercase transition-colors px-1 py-0.5 rounded ${
              current === lang.code
                ? "text-[#86C0C7]"
                : "text-white/60 hover:text-white"
            }`}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}
