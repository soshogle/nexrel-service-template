import { useState, useEffect } from "react";
import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Lock, Eye, EyeOff, ArrowRight, MapPin, BedDouble, Bath,
  Shield, Star, Home, Building2, X, CheckCircle2,
  FileText, TrendingUp, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "nexrel-secret-buyer";

interface BuyerProfile {
  name: string;
  email: string;
  phone: string;
  budgetMin?: number;
  budgetMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyTypes?: string[];
  neighborhoods?: string[];
  moveTimeline?: string;
  preApproved?: boolean;
  registeredAt: string;
}

function getSavedBuyer(): BuyerProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const buyer = JSON.parse(raw) as BuyerProfile;
    const age = Date.now() - new Date(buyer.registeredAt).getTime();
    if (age > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return buyer;
  } catch {
    return null;
  }
}

function saveBuyer(buyer: BuyerProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buyer));
}

function formatPriceRange(price: number): string {
  if (price >= 1_000_000) {
    const low = Math.floor(price / 100_000) * 100_000;
    const high = low + 100_000;
    return `$${(low / 1_000_000).toFixed(1)}M – $${(high / 1_000_000).toFixed(1)}M`;
  }
  const low = Math.floor(price / 50_000) * 50_000;
  const high = low + 50_000;
  return `$${low.toLocaleString()} – $${high.toLocaleString()}`;
}

function SecretPropertyCard({
  property,
  unlocked,
  onUnlock,
}: {
  property: any;
  unlocked: boolean;
  onUnlock: () => void;
}) {
  const { t } = useTranslation();
  const price = parseFloat(property.price || "0");

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-[#E8F4F4]">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={property.mainImageUrl || "/placeholder.jpg"}
          alt={unlocked ? property.title : t("secret.exclusiveListing")}
          className={`w-full h-full object-cover transition-all duration-500 ${
            unlocked ? "group-hover:scale-105" : "blur-md scale-110 brightness-75"
          }`}
        />
        {!unlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center mb-3 shadow-lg">
              <Lock className="w-7 h-7 text-[#214359]" />
            </div>
            <p className="text-white font-medium text-sm tracking-wider uppercase">
              {t("secret.registerToView")}
            </p>
          </div>
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-[#214359]/90 backdrop-blur text-white text-xs font-medium tracking-wider uppercase px-3 py-1.5 rounded-full">
            {t("secret.exclusive")}
          </span>
          {property.isNew && (
            <span className="bg-[#86C0C7] text-white text-xs font-medium tracking-wider uppercase px-3 py-1.5 rounded-full">
              {t("secret.new")}
            </span>
          )}
        </div>
        {unlocked && (
          <div className="absolute top-4 right-4">
            <span className="bg-green-500/90 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
              <Eye size={12} /> {t("secret.unlocked")}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {unlocked ? (
          <>
            <h3 className="font-serif text-[#214359] text-lg mb-1 group-hover:text-[#86C0C7] transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[#214359]/60 text-sm mb-3">
              <MapPin size={14} className="shrink-0" />
              <span className="line-clamp-1">{property.address}, {property.city}</span>
            </div>
            <p className="text-[#214359] font-semibold text-xl mb-3">
              ${price.toLocaleString()}
            </p>
          </>
        ) : (
          <>
            <h3 className="font-serif text-[#214359] text-lg mb-1">
              {property.neighborhood || property.city || t("secret.exclusiveProperty")}
            </h3>
            <div className="flex items-center gap-1.5 text-[#214359]/60 text-sm mb-3">
              <MapPin size={14} className="shrink-0" />
              <span>{property.city}{property.neighborhood ? `, ${property.neighborhood}` : ""}</span>
            </div>
            <p className="text-[#214359] font-semibold text-xl mb-3">
              {formatPriceRange(price)}
            </p>
          </>
        )}

        <div className="flex items-center gap-4 text-[#214359]/70 text-sm border-t border-[#E8F4F4] pt-3 mb-4">
          {property.bedrooms != null && Number(property.bedrooms) > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble size={14} /> {property.bedrooms} {t("common.beds")}
            </span>
          )}
          {property.bathrooms != null && Number(property.bathrooms) > 0 && (
            <span className="flex items-center gap-1">
              <Bath size={14} /> {property.bathrooms} {t("common.bath")}
            </span>
          )}
          {property.area && (
            <span>{property.area} {property.areaUnit || "ft²"}</span>
          )}
        </div>

        {unlocked ? (
          <Link href={`/property/${property.slug || property.id}`}>
            <Button className="w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white uppercase tracking-wider text-sm">
              {t("secret.viewFullDetails")}
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onUnlock}
            className="w-full bg-[#214359] hover:bg-[#1a3548] text-white uppercase tracking-wider text-sm"
          >
            <Lock size={14} className="mr-2" />
            {t("secret.unlockProperty")}
          </Button>
        )}
      </div>
    </div>
  );
}

function BuyerRegistrationModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (data: BuyerProfile) => void;
  submitting: boolean;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [moveTimeline, setMoveTimeline] = useState("");
  const [preApproved, setPreApproved] = useState<boolean | undefined>();
  const [step, setStep] = useState(1);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error(t("secret.fillRequired"));
      return;
    }
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      moveTimeline: moveTimeline || undefined,
      preApproved,
      registeredAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-[#214359] text-2xl">
                {step === 1 ? t("secret.registerTitle") : t("secret.buyerCriteriaTitle")}
              </h2>
              <p className="text-[#214359]/60 text-sm mt-1">
                {step === 1 ? t("secret.step1of2") : t("secret.step2of2")}
              </p>
            </div>
            <button onClick={onClose} className="p-2 -m-2 text-[#214359]/40 hover:text-[#214359] transition-colors">
              <X size={22} />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-[#86C0C7]" : "bg-[#E8F4F4]"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-[#86C0C7]" : "bg-[#E8F4F4]"}`} />
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-[#214359]/5 rounded-lg mb-2">
                <Shield size={22} className="text-[#86C0C7] shrink-0" />
                <p className="text-[#214359]/70 text-sm">
                  {t("secret.privacyNote")}
                </p>
              </div>

              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-semibold mb-2 block">
                  {t("secret.nameLabel")} *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("secret.namePlaceholder")}
                  className="border-[#214359]/15 h-12 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-semibold mb-2 block">
                  {t("secret.emailLabel")} *
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("secret.emailPlaceholder")}
                  className="border-[#214359]/15 h-12 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-semibold mb-2 block">
                  {t("secret.phoneLabel")} *
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(514) 555-1234"
                  className="border-[#214359]/15 h-12 rounded-lg"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#214359] hover:bg-[#1a3548] text-white h-12 uppercase tracking-wider rounded-lg"
              >
                {t("secret.continue")} <ArrowRight size={16} className="ml-2" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-[#214359]/60 text-sm">
                {t("secret.criteriaOptional")}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-semibold mb-2 block">
                    {t("secret.budgetMin")}
                  </label>
                  <Input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="$200,000"
                    className="border-[#214359]/15 h-12 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-semibold mb-2 block">
                    {t("secret.budgetMax")}
                  </label>
                  <Input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="$800,000"
                    className="border-[#214359]/15 h-12 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-semibold mb-2 block">
                    {t("common.bedrooms")}
                  </label>
                  <div className="flex gap-2">
                    {["1", "2", "3", "4", "5+"].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setBedrooms(bedrooms === n ? "" : n)}
                        className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                          bedrooms === n
                            ? "bg-[#86C0C7] text-white"
                            : "bg-[#E8F4F4] text-[#214359]/70 hover:bg-[#86C0C7]/20"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#214359] uppercase tracking-wider font-semibold mb-2 block">
                    {t("common.bathrooms")}
                  </label>
                  <div className="flex gap-2">
                    {["1", "2", "3", "4+"].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setBathrooms(bathrooms === n ? "" : n)}
                        className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                          bathrooms === n
                            ? "bg-[#86C0C7] text-white"
                            : "bg-[#E8F4F4] text-[#214359]/70 hover:bg-[#86C0C7]/20"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-semibold mb-2 block">
                  {t("secret.timeline")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "1-3 months", label: t("secret.timeline1_3") },
                    { value: "3-6 months", label: t("secret.timeline3_6") },
                    { value: "6-12 months", label: t("secret.timeline6_12") },
                    { value: "12+ months", label: t("secret.timeline12") },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMoveTimeline(moveTimeline === opt.value ? "" : opt.value)}
                      className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                        moveTimeline === opt.value
                          ? "bg-[#86C0C7] text-white"
                          : "bg-[#E8F4F4] text-[#214359]/70 hover:bg-[#86C0C7]/20"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#214359] uppercase tracking-wider font-semibold mb-2 block">
                  {t("secret.preApproved")}
                </label>
                <div className="flex gap-3">
                  {[
                    { value: true, label: t("secret.yes") },
                    { value: false, label: t("secret.no") },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setPreApproved(preApproved === opt.value ? undefined : opt.value)}
                      className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                        preApproved === opt.value
                          ? "bg-[#86C0C7] text-white"
                          : "bg-[#E8F4F4] text-[#214359]/70 hover:bg-[#86C0C7]/20"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-lg border-[#214359]/20 text-[#214359]"
                >
                  {t("secret.back")}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#86C0C7] hover:bg-[#6AABB3] text-white h-12 uppercase tracking-wider rounded-lg"
                >
                  {submitting ? t("secret.registering") : t("secret.unlockAll")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

type ReportType = "BUYER_ATTRACTION" | "SELLER_ATTRACTION" | "MARKET_INSIGHT";

interface Report {
  id: string;
  reportType: ReportType;
  title: string;
  region?: string | null;
  executiveSummary?: string | null;
  content: Record<string, unknown>;
  pdfUrl?: string | null;
  createdAt: string;
}

const REPORT_TYPE_KEYS: Record<ReportType, string> = {
  BUYER_ATTRACTION: "secretReports.buyerAttraction",
  SELLER_ATTRACTION: "secretReports.sellerAttraction",
  MARKET_INSIGHT: "secretReports.marketInsight",
};

const REPORT_ICONS: Record<ReportType, typeof FileText> = {
  BUYER_ATTRACTION: TrendingUp,
  SELLER_ATTRACTION: BarChart3,
  MARKET_INSIGHT: FileText,
};

function ReportCard({ report, unlocked, onUnlock }: { report: Report; unlocked: boolean; onUnlock: () => void }) {
  const { t } = useTranslation();
  const Icon = REPORT_ICONS[report.reportType] ?? FileText;
  return (
    <div className="group border border-[#E8F4F4] rounded-lg bg-white hover:shadow-lg transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#86C0C7]/10 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-[#86C0C7]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium tracking-wider uppercase text-[#86C0C7]">
              {t(REPORT_TYPE_KEYS[report.reportType] ?? "secretReports.report")}
            </span>
            <h3 className="font-serif text-[#214359] text-lg mt-1">{report.title}</h3>
            {report.region && <p className="text-[#214359]/60 text-sm mt-1">{report.region}</p>}
            {report.executiveSummary && (
              <p className="text-[#214359]/70 text-sm mt-2 line-clamp-2">{report.executiveSummary}</p>
            )}
          </div>
        </div>
        <Button
          onClick={onUnlock}
          className="mt-5 w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white uppercase tracking-wider text-sm"
        >
          {unlocked ? t("secretReports.viewReport") : t("secretReports.unlockReport")}
        </Button>
      </div>
    </div>
  );
}

function ReportViewModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const { t } = useTranslation();
  const content = report.content as Record<string, unknown>;
  const type = report.reportType;

  let body;
  if (type === "BUYER_ATTRACTION") {
    const opportunities = (content.opportunities as Array<{ type: string; description: string; potentialSavings?: string }>) || [];
    const marketInsight = (content.marketInsight as string) || "";
    const buyerTips = (content.buyerTips as string[]) || [];
    body = (
      <>
        {marketInsight && <div><h4 className="font-medium text-[#214359] mb-2">{t("secretReports.marketInsightSection")}</h4><p className="text-[#214359]/80">{marketInsight}</p></div>}
        {opportunities.length > 0 && <div><h4 className="font-medium text-[#214359] mb-3">{t("secretReports.opportunities")}</h4><ul className="space-y-3">{opportunities.map((o, i) => <li key={i} className="p-4 bg-[#E8F4F4]/50 rounded-lg border-l-4 border-[#86C0C7]"><p className="font-medium text-[#214359]">{o.type}</p><p className="text-[#214359]/80 text-sm mt-1">{o.description}</p>{o.potentialSavings && <p className="text-[#86C0C7] text-sm mt-2">{o.potentialSavings}</p>}</li>)}</ul></div>}
        {buyerTips.length > 0 && <div><h4 className="font-medium text-[#214359] mb-2">{t("secretReports.buyerTips")}</h4><ul className="list-disc list-inside space-y-1 text-[#214359]/80">{buyerTips.map((tip, i) => <li key={i}>{tip}</li>)}</ul></div>}
      </>
    );
  } else if (type === "SELLER_ATTRACTION") {
    const indicators = (content.demandIndicators as Array<{ indicator: string; value: string; insight: string }>) || [];
    const equityEstimate = (content.equityEstimate as string) || "";
    const sellerTips = (content.sellerTips as string[]) || [];
    body = (
      <>
        {equityEstimate && <div><h4 className="font-medium text-[#214359] mb-2">{t("secretReports.equityEstimate")}</h4><p className="text-[#214359]/80">{equityEstimate}</p></div>}
        {indicators.length > 0 && <div><h4 className="font-medium text-[#214359] mb-3">{t("secretReports.demandIndicators")}</h4><ul className="space-y-3">{indicators.map((d, i) => <li key={i} className="p-4 bg-[#E8F4F4]/50 rounded-lg"><p className="font-medium text-[#214359]">{d.indicator}</p><p className="text-[#86C0C7] text-sm">{d.value}</p><p className="text-[#214359]/80 text-sm mt-1">{d.insight}</p></li>)}</ul></div>}
        {sellerTips.length > 0 && <div><h4 className="font-medium text-[#214359] mb-2">{t("secretReports.sellerTips")}</h4><ul className="list-disc list-inside space-y-1 text-[#214359]/80">{sellerTips.map((tip, i) => <li key={i}>{tip}</li>)}</ul></div>}
      </>
    );
  } else {
    const summary = report.executiveSummary || (content.executiveSummary as string) || "";
    const highlights = (content.keyHighlights as string[]) || [];
    body = (
      <>
        {summary && <div><h4 className="font-medium text-[#214359] mb-2">{t("secretReports.executiveSummary")}</h4><p className="text-[#214359]/80">{summary}</p></div>}
        {highlights.length > 0 && <div><h4 className="font-medium text-[#214359] mb-2">{t("secretReports.keyHighlights")}</h4><ul className="list-disc list-inside space-y-1 text-[#214359]/80">{highlights.map((h, i) => <li key={i}>{typeof h === "string" ? h : JSON.stringify(h)}</li>)}</ul></div>}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-[#214359] text-xl">{report.title}</h2>
            <button onClick={onClose} className="p-2 -m-2 text-[#214359]/40 hover:text-[#214359]"><X size={20} /></button>
          </div>
          <div className="space-y-6">{body}</div>
          {report.pdfUrl && (
            <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-6 text-[#86C0C7] font-medium hover:underline">
              {t("secretReports.downloadPdf")} <ArrowRight size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SecretProperties() {
  const { t } = useTranslation();
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [unlockedReports, setUnlockedReports] = useState<Record<string, Report>>({});

  useEffect(() => {
    setBuyer(getSavedBuyer());
  }, []);

  const isUnlocked = !!buyer;

  const { data: propertiesData, isLoading: propsLoading } = trpc.properties.list.useQuery({
    secret: true,
    limit: 20,
    sortBy: "newest",
  });
  const { data: reportsData } = trpc.secretReports.list.useQuery();

  const properties = propertiesData?.items ?? [];
  const reports = (reportsData?.reports ?? []) as Report[];

  const handleRegister = async (profile: BuyerProfile) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/secret-property-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          budgetMin: profile.budgetMin,
          budgetMax: profile.budgetMax,
          bedrooms: profile.bedrooms ? Number(String(profile.bedrooms).replace("+", "")) : undefined,
          bathrooms: profile.bathrooms ? Number(String(profile.bathrooms).replace("+", "")) : undefined,
          moveTimeline: profile.moveTimeline,
          preApproved: profile.preApproved,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Registration failed");
      }
      saveBuyer(profile);
      setBuyer(profile);
      setShowModal(false);
      toast.success(t("secret.registrationSuccess"));
    } catch (e: unknown) {
      toast.error((e as Error)?.message || t("secret.registrationFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportUnlock = async (report: Report) => {
    if (!buyer) {
      setShowModal(true);
      return;
    }
    if (unlockedReports[report.id]) {
      setViewingReport(unlockedReports[report.id]);
      return;
    }
    try {
      const lang = localStorage.getItem("nexrel-lang") || "en";
      const res = await fetch("/api/secret-reports/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          name: buyer.name,
          email: buyer.email,
          phone: buyer.phone,
          language: lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unlock");
      setUnlockedReports((prev) => ({ ...prev, [report.id]: data.report }));
      setViewingReport(data.report);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || t("secretReports.unlockFailed"));
    }
  };

  const hasContent = properties.length > 0 || reports.length > 0;

  return (
    <div className="pt-20">
      <PageHero
        label={t("secret.heroLabel")}
        title={t("secret.heroTitle")}
        subtitle={t("secret.heroSubtitle")}
      />

      {/* Value proposition */}
      <section className="py-12 bg-gradient-to-b from-[#214359]/5 to-white">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Eye, title: t("secret.benefit1Title"), desc: t("secret.benefit1Desc") },
              { icon: Star, title: t("secret.benefit2Title"), desc: t("secret.benefit2Desc") },
              { icon: Shield, title: t("secret.benefit3Title"), desc: t("secret.benefit3Desc") },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-white shadow-sm border border-[#E8F4F4]">
                <div className="w-10 h-10 rounded-full bg-[#86C0C7]/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-[#86C0C7]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#214359] text-sm">{item.title}</h3>
                  <p className="text-[#214359]/60 text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secret Properties Grid */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-[#214359] text-3xl">{t("secret.propertiesTitle")}</h2>
              <p className="text-[#214359]/60 mt-2">{t("secret.propertiesSubtitle")}</p>
            </div>
            {isUnlocked && (
              <div className="hidden md:flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <CheckCircle2 size={16} />
                {t("secret.accessGranted")}
              </div>
            )}
          </div>

          {!isUnlocked && (
            <div className="flex items-center gap-4 p-6 mb-8 bg-[#214359]/5 rounded-xl border border-[#214359]/10">
              <Lock size={28} className="text-[#214359]/60 shrink-0" />
              <div className="flex-1">
                <p className="text-[#214359] font-medium">{t("secret.gateBannerTitle")}</p>
                <p className="text-[#214359]/60 text-sm mt-1">{t("secret.gateBannerDesc")}</p>
              </div>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-[#86C0C7] hover:bg-[#6AABB3] text-white shrink-0"
              >
                {t("secret.registerNow")}
              </Button>
            </div>
          )}

          {propsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-[#E8F4F4]/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property: any) => (
                <SecretPropertyCard
                  key={property.id}
                  property={property}
                  unlocked={isUnlocked}
                  onUnlock={() => setShowModal(true)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#E8F4F4]/20 rounded-xl">
              <Home size={48} className="text-[#86C0C7]/40 mx-auto mb-4" />
              <h3 className="font-serif text-[#214359] text-xl mb-2">{t("secret.noPropertiesTitle")}</h3>
              <p className="text-[#214359]/60 max-w-md mx-auto mb-6">{t("secret.noPropertiesDesc")}</p>
              {!isUnlocked && (
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-[#86C0C7] hover:bg-[#6AABB3] text-white"
                >
                  {t("secret.registerForNotifications")}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Reports Section */}
      {reports.length > 0 && (
        <section className="py-16 bg-[#F8FAFA]">
          <div className="container max-w-5xl">
            <h2 className="font-serif text-[#214359] text-3xl mb-2">{t("secret.reportsTitle")}</h2>
            <p className="text-[#214359]/60 mb-8">{t("secret.reportsSubtitle")}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  unlocked={!!unlockedReports[report.id]}
                  onUnlock={() => handleReportUnlock(report)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {!isUnlocked && hasContent && (
        <section className="py-20 bg-[#214359]">
          <div className="container max-w-3xl text-center">
            <Lock size={40} className="text-[#86C0C7] mx-auto mb-6" />
            <h2 className="font-serif text-white text-3xl mb-4">{t("secret.ctaTitle")}</h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">{t("secret.ctaDesc")}</p>
            <Button
              onClick={() => setShowModal(true)}
              size="lg"
              className="bg-[#86C0C7] hover:bg-[#6AABB3] text-white px-10 h-14 uppercase tracking-wider rounded-lg"
            >
              {t("secret.registerNow")}
            </Button>
          </div>
        </section>
      )}

      {/* Browse public listings link */}
      <section className="py-10 bg-white">
        <div className="container text-center">
          <Link href="/for-sale" className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm hover:underline">
            {t("secret.viewPublicListings")} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Modals */}
      {showModal && (
        <BuyerRegistrationModal
          onClose={() => setShowModal(false)}
          onSubmit={handleRegister}
          submitting={submitting}
        />
      )}
      {viewingReport && (
        <ReportViewModal report={viewingReport} onClose={() => setViewingReport(null)} />
      )}
    </div>
  );
}
