import { useState } from "react";
import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Lock, ArrowRight, FileText, TrendingUp, BarChart3, X } from "lucide-react";
import { toast } from "sonner";

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

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  BUYER_ATTRACTION: "Buyer Attraction Report",
  SELLER_ATTRACTION: "Seller Attraction Report",
  MARKET_INSIGHT: "Market Insight Report",
};

const REPORT_TYPE_ICONS: Record<ReportType, typeof FileText> = {
  BUYER_ATTRACTION: TrendingUp,
  SELLER_ATTRACTION: BarChart3,
  MARKET_INSIGHT: FileText,
};

function ReportCard({
  report,
  onView,
}: {
  report: Report;
  onView: () => void;
}) {
  const Icon = REPORT_TYPE_ICONS[report.reportType] ?? FileText;
  const label = REPORT_TYPE_LABELS[report.reportType] ?? "Report";

  return (
    <div className="group border border-[#E8F4F4] rounded-sm bg-white hover:shadow-lg hover:border-[#86C0C7]/40 transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#86C0C7]/10 flex items-center justify-center shrink-0 group-hover:bg-[#86C0C7]/20 transition-colors">
            <Icon className="w-6 h-6 text-[#86C0C7]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium tracking-wider uppercase text-[#86C0C7]">{label}</span>
            <h3 className="font-serif text-[#214359] text-lg mt-1">{report.title}</h3>
            {report.region && (
              <p className="text-[#214359]/60 text-sm mt-1">{report.region}</p>
            )}
            {report.executiveSummary && (
              <p className="text-[#214359]/70 text-sm mt-3 line-clamp-2">{report.executiveSummary}</p>
            )}
          </div>
        </div>
        <Button
          onClick={onView}
          className="mt-6 w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white uppercase tracking-wider"
        >
          View Report
        </Button>
      </div>
    </div>
  );
}

function ReportViewModal({
  report,
  onClose,
  onUnlock,
}: {
  report: Report;
  onClose: () => void;
  onUnlock: (data: { name: string; email: string; phone: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }
    setSubmitting(true);
    try {
      onUnlock({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-[#214359] text-xl">{report.title}</h2>
            <button onClick={onClose} className="p-2 -m-2 text-[#214359]/60 hover:text-[#214359]">
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[#E8F4F4] rounded-sm mb-6">
            <Lock size={24} className="text-[#86C0C7] shrink-0" />
            <p className="text-[#214359]/80 text-sm">
              Enter your details to unlock this exclusive report. Your information will be used to follow up with personalized insights.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Name *</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="border-[#214359]/20 h-12"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Email *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="border-[#214359]/20 h-12"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Phone *</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(514) 555-1234"
                className="border-[#214359]/20 h-12"
                required
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white h-12 uppercase tracking-wider">
              {submitting ? "Unlocking..." : "Unlock Report"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReportContent({ report }: { report: Report }) {
  const content = report.content as Record<string, unknown>;
  const type = report.reportType;

  if (type === "BUYER_ATTRACTION") {
    const opportunities = (content.opportunities as Array<{ type: string; description: string; potentialSavings?: string; urgency: string }>) || [];
    const marketInsight = (content.marketInsight as string) || "";
    const buyerTips = (content.buyerTips as string[]) || [];
    return (
      <div className="space-y-6">
        {marketInsight && (
          <div>
            <h4 className="font-medium text-[#214359] mb-2">Market Insight</h4>
            <p className="text-[#214359]/80">{marketInsight}</p>
          </div>
        )}
        {opportunities.length > 0 && (
          <div>
            <h4 className="font-medium text-[#214359] mb-3">Opportunities</h4>
            <ul className="space-y-3">
              {opportunities.map((o, i) => (
                <li key={i} className="p-4 bg-[#E8F4F4]/50 rounded-sm border-l-4 border-[#86C0C7]">
                  <p className="font-medium text-[#214359]">{o.type}</p>
                  <p className="text-[#214359]/80 text-sm mt-1">{o.description}</p>
                  {o.potentialSavings && (
                    <p className="text-[#86C0C7] text-sm mt-2">{o.potentialSavings}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {buyerTips.length > 0 && (
          <div>
            <h4 className="font-medium text-[#214359] mb-2">Buyer Tips</h4>
            <ul className="list-disc list-inside space-y-1 text-[#214359]/80">
              {buyerTips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (type === "SELLER_ATTRACTION") {
    const indicators = (content.demandIndicators as Array<{ indicator: string; value: string; trend: string; insight: string }>) || [];
    const equityEstimate = (content.equityEstimate as string) || "";
    const sellerTips = (content.sellerTips as string[]) || [];
    return (
      <div className="space-y-6">
        {equityEstimate && (
          <div>
            <h4 className="font-medium text-[#214359] mb-2">Equity Estimate</h4>
            <p className="text-[#214359]/80">{equityEstimate}</p>
          </div>
        )}
        {indicators.length > 0 && (
          <div>
            <h4 className="font-medium text-[#214359] mb-3">Demand Indicators</h4>
            <ul className="space-y-3">
              {indicators.map((d, i) => (
                <li key={i} className="p-4 bg-[#E8F4F4]/50 rounded-sm">
                  <p className="font-medium text-[#214359]">{d.indicator}</p>
                  <p className="text-[#86C0C7] text-sm">{d.value}</p>
                  <p className="text-[#214359]/80 text-sm mt-1">{d.insight}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {sellerTips.length > 0 && (
          <div>
            <h4 className="font-medium text-[#214359] mb-2">Seller Tips</h4>
            <ul className="list-disc list-inside space-y-1 text-[#214359]/80">
              {sellerTips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // MARKET_INSIGHT or generic
  const summary = report.executiveSummary || (content.executiveSummary as string) || "";
  const highlights = (content.keyHighlights as string[]) || (report.content as Record<string, unknown>).keyHighlights;
  return (
    <div className="space-y-6">
      {summary && (
        <div>
          <h4 className="font-medium text-[#214359] mb-2">Executive Summary</h4>
          <p className="text-[#214359]/80">{summary}</p>
        </div>
      )}
      {Array.isArray(highlights) && highlights.length > 0 && (
        <div>
          <h4 className="font-medium text-[#214359] mb-2">Key Highlights</h4>
          <ul className="list-disc list-inside space-y-1 text-[#214359]/80">
            {highlights.map((h, i) => (
              <li key={i}>{typeof h === "string" ? h : JSON.stringify(h)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SecretProperties() {
  const { data, isLoading } = trpc.secretReports.list.useQuery();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [unlockedReportId, setUnlockedReportId] = useState<string | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  const reports = (data?.reports ?? []) as Report[];

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    if (unlockedReportId === report.id) {
      setShowLeadModal(false);
    } else {
      setShowLeadModal(true);
    }
  };

  const handleUnlock = async (formData: { name: string; email: string; phone: string }) => {
    if (!selectedReport) return;
    try {
      const res = await fetch("/api/voice/push-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          source: "Secret Properties Report",
          notes: `Viewed report: ${selectedReport.id} - ${selectedReport.title}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit");
      }
      setUnlockedReportId(selectedReport.id);
      setShowLeadModal(false);
      toast.success("Report unlocked! You can now view the full content.");
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Failed to unlock. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
    setShowLeadModal(false);
  };

  return (
    <div className="pt-20">
      <PageHero
        label="SECRET PROPERTIES & REPORTS"
        title="Exclusive Market Insights"
        subtitle="Access off-market listings and expert reports. Enter your details to view each report — we'll follow up with personalized insights."
      />
      <section className="py-24 bg-white">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-[#E8F4F4]/50 rounded-sm animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={48} className="text-[#86C0C7]/50 mx-auto mb-6" />
              <h2 className="font-serif text-[#214359] text-2xl mb-4">No Reports Yet</h2>
              <p className="text-[#214359]/70 mb-8 max-w-md mx-auto">
                Exclusive market reports will appear here when they're published. Register below to be notified when new reports become available.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="bg-[#86C0C7] hover:bg-[#6AABB3] text-white">
                    Get in Touch
                  </Button>
                </Link>
                <Link href="/for-sale">
                  <Button variant="outline" className="border-[#214359]/30 text-[#214359]">
                    View Public Listings
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-8 p-6 bg-[#E8F4F4] rounded-sm">
                <Lock size={24} className="text-[#86C0C7] shrink-0" />
                <p className="text-[#214359]/80 text-sm">
                  These reports are exclusive to our registered contacts. Click &quot;View Report&quot; and enter your details to unlock — your information is used to follow up with personalized market insights and is added to our CRM for campaigns and workflow triggers.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report) => (
                  <ReportCard key={report.id} report={report} onView={() => handleViewReport(report)} />
                ))}
              </div>
            </>
          )}
          <div className="mt-12 text-center">
            <Link href="/for-sale" className="inline-flex items-center gap-2 text-[#86C0C7] font-medium tracking-wider uppercase text-sm">
              View Public Listings
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Lead capture modal */}
      {showLeadModal && selectedReport && (
        <ReportViewModal
          report={selectedReport}
          onClose={handleCloseModal}
          onUnlock={handleUnlock}
        />
      )}

      {/* Report content modal (after unlock) */}
      {selectedReport && !showLeadModal && unlockedReportId === selectedReport.id && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-[#214359] text-xl">{selectedReport.title}</h2>
                <button onClick={handleCloseModal} className="p-2 -m-2 text-[#214359]/60 hover:text-[#214359]">
                  <X size={20} />
                </button>
              </div>
              <ReportContent report={selectedReport} />
              {selectedReport.pdfUrl && (
                <a
                  href={selectedReport.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-[#86C0C7] font-medium hover:underline"
                >
                  Download PDF
                  <ArrowRight size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
