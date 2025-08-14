
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const leadSchema = z.object({
  lead_name: z.string().min(1, "Lead name is required"),
  company_name: z.string().optional(),
  position: z.string().optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone_no: z.string().optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  contact_source: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  lead_status: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  country?: string;
  description?: string;
  lead_status?: string;
}

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSuccess: () => void;
}

const leadSources = [
  "LinkedIn",
  "Website",
  "Referral", 
  "Social Media",
  "Email Campaign",
  "Other"
];

const industries = [
  "Automotive",
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Other"
];

const regions = [
  "EU",
  "US", 
  "ASIA",
  "Other"
];

const leadStatuses = [
  "New",
  "Contacted",
  "Converted"
];

export const LeadModal = ({ open, onOpenChange, lead, onSuccess }: LeadModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      lead_name: "",
      company_name: "",
      position: "",
      email: "",
      phone_no: "",
      linkedin: "",
      website: "",
      contact_source: "",
      industry: "Automotive",
      country: "EU",
      description: "",
      lead_status: "New",
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        lead_name: lead.lead_name || "",
        company_name: lead.company_name || "",
        position: lead.position || "",
        email: lead.email || "",
        phone_no: lead.phone_no || "",
        linkedin: lead.linkedin || "",
        website: lead.website || "",
        contact_source: lead.contact_source || "",
        industry: lead.industry || "Automotive",
        country: lead.country || "EU",
        description: lead.description || "",
        lead_status: lead.lead_status || "New",
      });
    } else {
      form.reset({
        lead_name: "",
        company_name: "",
        position: "",
        email: "",
        phone_no: "",
        linkedin: "",
        website: "",
        contact_source: "",
        industry: "Automotive",
        country: "EU",
        description: "",
        lead_status: "New",
      });
    }
  }, [lead, form]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        });
        return;
      }

      const leadData = {
        lead_name: data.lead_name,
        company_name: data.company_name || null,
        position: data.position || null,
        email: data.email,
        phone_no: data.phone_no || null,
        linkedin: data.linkedin || null,
        website: data.website || null,
        contact_source: data.contact_source || null,
        industry: data.industry || null,
        country: data.country || null,
        description: data.description || null,
        lead_status: data.lead_status || 'New',
        created_by: user.data.user.id,
        modified_by: user.data.user.id,
        contact_owner: user.data.user.id,
      };

      if (lead) {
        // Update existing lead
        const { error } = await supabase
          .from('leads')
          .update({
            ...leadData,
            modified_time: new Date().toISOString(),
          })
          .eq('id', lead.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        // Create new lead
        const { error } = await supabase
          .from('leads')
          .insert(leadData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: lead ? "Failed to update lead" : "Failed to create lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lead ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lead_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lead Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="CEO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder=" " {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://realthingks.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lead_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="New" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about the lead..."
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
