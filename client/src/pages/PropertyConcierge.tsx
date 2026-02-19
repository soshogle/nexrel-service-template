import { useEffect } from "react";
import { PageHero } from "@/components/PageHero";
import { Mic } from "lucide-react";

export default function PropertyConcierge() {
  const openVoiceAI = () => {
    window.dispatchEvent(new CustomEvent("openVoiceAI", { detail: { propertyConcierge: true } }));
  };

  // Open Voice AI when landing on Property Concierge page (from nav or direct)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("openVoiceAI", { detail: { propertyConcierge: true } }));
  }, []);

  return (
    <div className="pt-20">
      <PageHero
        label="PROPERTY CONCIERGE"
        title="Your AI Assistant"
        subtitle="Ask about listings, schedule viewings, or get answers — just click below to start a conversation."
      />
      <section className="py-24 bg-white">
        <div className="container max-w-2xl text-center">
          <p className="text-[#214359]/80 leading-relaxed mb-12">
            Our Voice AI assistant is ready to help you find properties, answer questions about the market,
            and guide you through your real estate journey. Click the button below to start a conversation.
          </p>
          <button
            onClick={openVoiceAI}
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#86C0C7] text-white font-medium tracking-wider uppercase text-sm rounded-sm hover:bg-[#6AABB3] transition-colors"
          >
            <Mic size={24} />
            Talk to AI Assistant
          </button>
          <p className="mt-6 text-[#214359]/60 text-sm">
            Or click the microphone icon in the bottom-right corner of any page.
          </p>
        </div>
      </section>
    </div>
  );
}
