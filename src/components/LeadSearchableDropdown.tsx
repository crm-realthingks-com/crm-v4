import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  country?: string;
  created_by?: string;
}

interface LeadSearchableDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  onLeadSelect: (lead: Lead) => void;
  placeholder?: string;
  className?: string;
}

export const LeadSearchableDropdown = ({
  value,
  onValueChange,
  onLeadSelect,
  placeholder = "Select lead...",
  className
}: LeadSearchableDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { toast } = useToast();

  // Get unique created_by IDs for fetching display names
  const createdByIds = useMemo(() => {
    return [...new Set(leads.map(l => l.created_by).filter(Boolean))];
  }, [leads]);
  
  const { displayNames } = useUserDisplayNames(createdByIds);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('id, lead_name, company_name, country, created_by, lead_status')
        .neq('lead_status', 'Converted') // Only show leads that haven't been converted to deals yet
        .order('lead_name', { ascending: true });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter leads based on search value with debouncing effect
  const filteredLeads = useMemo(() => {
    if (!searchValue) return leads;
    
    const searchLower = searchValue.toLowerCase();
    return leads.filter(lead => 
      lead.lead_name?.toLowerCase().includes(searchLower) ||
      lead.company_name?.toLowerCase().includes(searchLower) ||
      lead.country?.toLowerCase().includes(searchLower)
    );
  }, [leads, searchValue]);

  const selectedLead = leads.find(lead => lead.lead_name === value);

  const handleSelect = (lead: Lead) => {
    onValueChange(lead.lead_name);
    onLeadSelect(lead);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value ? (
            <span className="truncate">
              {selectedLead?.lead_name || value}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search leads..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading leads...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>No leads found.</CommandEmpty>
                <CommandGroup>
                  {filteredLeads.map((lead) => (
                    <CommandItem
                      key={lead.id}
                      value={lead.lead_name}
                      onSelect={() => handleSelect(lead)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === lead.lead_name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{lead.lead_name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {lead.company_name && (
                            <span>{lead.company_name}</span>
                          )}
                          {lead.company_name && lead.country && <span> • </span>}
                          {lead.country && (
                            <span>{lead.country}</span>
                          )}
                          {lead.created_by && (
                            <>
                              <span> • Owner: </span>
                              <span>{displayNames[lead.created_by] || "Unknown"}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};