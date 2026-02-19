import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Maintenance() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", issue: "" });

  const submit = trpc.inquiries.submit.useMutation({
    onSuccess: () => {
      toast.success("Your maintenance request has been submitted.");
      setFormData({ name: "", email: "", phone: "", address: "", issue: "" });
    },
    onError: (e) => toast.error(e.message || "Failed to submit."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.issue) {
      toast.error("Please fill in required fields.");
      return;
    }
    submit.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      message: `Maintenance Request\nAddress: ${formData.address || "N/A"}\n\nIssue: ${formData.issue}`,
    });
  };

  return (
    <div className="pt-20">
      <PageHero label="MAINTENANCE" title="Maintenance Request" subtitle="Report a maintenance issue with your rental property." />
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
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Property Address</label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="border-[#214359]/20 h-12" />
            </div>
            <div>
              <label className="text-xs text-[#214359] uppercase tracking-wider font-medium mb-2 block">Describe the Issue *</label>
              <Textarea value={formData.issue} onChange={(e) => setFormData({ ...formData, issue: e.target.value })} rows={5} className="border-[#214359]/20 resize-none" required />
            </div>
            <Button type="submit" disabled={submit.isPending} className="w-full bg-[#86C0C7] hover:bg-[#6AABB3] text-white h-12 uppercase tracking-wider">
              {submit.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
