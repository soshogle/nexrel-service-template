import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function MarketAppraisal() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });

  const submitInquiry = trpc.inquiries.submit.useMutation({
    onSuccess: () => {
      toast.success("Your appraisal request has been received. We'll be in touch shortly.");
      setFormData({ name: "", email: "", phone: "", address: "", message: "" });
    },
    onError: (e) => toast.error(e.message || "Failed to submit. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill in required fields.");
      return;
    }
    submitInquiry.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      message: `Market Appraisal Request\nAddress: ${formData.address || "Not provided"}\n\n${formData.message || ""}`,
    });
  };

  return (
    <div className="pt-20">
      <PageHero
        label="MARKET APPRAISAL"
        title="Free Property Appraisal"
        subtitle="Get a no-obligation market appraisal of your property's value. Our experts will provide an accurate assessment."
      />
      <section className="py-24 bg-white">
        <div className="container max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Name *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Your name" className="border-[#214359]/20 h-12" required />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Email *</label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="your@email.com" className="border-[#214359]/20 h-12" required />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Phone</label>
              <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(514) 000-0000" className="border-[#214359]/20 h-12" />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Property Address</label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Street address" className="border-[#214359]/20 h-12" />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Additional Details</label>
              <Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Tell us about your property..." rows={4} className="border-[#214359]/20 resize-none" />
            </div>
            <Button type="submit" disabled={submitInquiry.isPending} className="w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white h-12 uppercase tracking-wider">
              {submitInquiry.isPending ? "Submitting..." : "Request Free Appraisal"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
