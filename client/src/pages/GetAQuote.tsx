import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function GetAQuote() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const submit = trpc.inquiries.submit.useMutation({
    onSuccess: () => {
      toast.success("Your quote request has been received. We'll be in touch shortly.");
      setFormData({ name: "", email: "", phone: "", service: "", message: "" });
    },
    onError: (e) => toast.error(e.message || "Failed to submit."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill in required fields.");
      return;
    }
    submit.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      message: `Quote Request\nService: ${formData.service || "General"}\n\n${formData.message || ""}`,
    });
  };

  return (
    <div className="pt-20">
      <PageHero label="GET A QUOTE" title="Get A Quote" subtitle="Tell us about your needs and we'll provide a tailored quote." />
      <section className="py-24 bg-white">
        <div className="container max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Name *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border-[#214359]/20 h-12" required />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Email *</label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="border-[#214359]/20 h-12" required />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Phone</label>
              <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="border-[#214359]/20 h-12" />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Service Interested In</label>
              <Input value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} placeholder="e.g. Selling, Buying, Property Management" className="border-[#214359]/20 h-12" />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Message</label>
              <Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={5} className="border-[#214359]/20 resize-none" />
            </div>
            <Button type="submit" disabled={submit.isPending} className="w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white h-12 uppercase tracking-wider">
              {submit.isPending ? "Submitting..." : "Request Quote"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
