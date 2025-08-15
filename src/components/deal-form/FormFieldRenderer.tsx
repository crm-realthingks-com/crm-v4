import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Deal } from "@/types/deal";
import { LeadSearchableDropdown } from "@/components/LeadSearchableDropdown";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";

interface FormFieldRendererProps {
  field: string;
  value: any;
  onChange: (field: string, value: any) => void;
  onLeadSelect?: (lead: any) => void;
  error?: string;
}

export const FormFieldRenderer = ({ field, value, onChange, onLeadSelect, error }: FormFieldRendererProps) => {
  const [leadOwnerIds, setLeadOwnerIds] = useState<string[]>([]);
  const { displayNames, loading } = useUserDisplayNames(leadOwnerIds);

  useEffect(() => {
    if (field === 'lead_owner') {
      fetchLeadOwners();
    }
  }, [field]);

  const fetchLeadOwners = async () => {
    try {
      // Fetch all unique lead owners (created_by) from leads table
      const { data: leads, error } = await supabase
        .from('leads')
        .select('created_by')
        .not('created_by', 'is', null);

      if (error) {
        console.error('Error fetching lead owners:', error);
        return;
      }

      // Get unique user IDs
      const uniqueUserIds = Array.from(new Set(leads.map(lead => lead.created_by).filter(Boolean)));
      setLeadOwnerIds(uniqueUserIds);
    } catch (error) {
      console.error('Error in fetchLeadOwners:', error);
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      project_name: 'Project Name',
      customer_name: 'Customer Name',
      lead_name: 'Lead Name',
      lead_owner: 'Lead Owner',
      region: 'Region',
      priority: 'Priority',
      probability: 'Probability (%)',
      internal_comment: 'Internal Comment',
      expected_closing_date: 'Expected Closing Date',
      customer_need: 'Customer Need',
      customer_challenges: 'Customer Challenges',
      relationship_strength: 'Relationship Strength',
      budget: 'Budget',
      is_recurring: 'Is Recurring?',
      project_type: 'Project Type',
      duration: 'Duration (months)',
      revenue: 'Revenue',
      start_date: 'Start Date',
      end_date: 'End Date',
      total_contract_value: 'Total Contract Value',
      currency_type: 'Currency Type',
      project_duration: 'Project Duration (months)',
      rfq_received_date: 'RFQ Received Date',
      proposal_due_date: 'Proposal Due Date',
      rfq_status: 'RFQ Status',
      quarterly_revenue_q1: 'Q1 Revenue',
      quarterly_revenue_q2: 'Q2 Revenue',
      quarterly_revenue_q3: 'Q3 Revenue',
      quarterly_revenue_q4: 'Q4 Revenue',
      total_revenue: 'Total Revenue',
      action_items: 'Action Items',
      current_status: 'Current Status',
      closing: 'Closing',
      won_reason: 'Won Reason',
      lost_reason: 'Lost Reason',
      need_improvement: 'Need Improvement',
      drop_reason: 'Drop Reason',
      fax: 'Fax',
      business_value: 'Business Value',
      decision_maker_level: 'Decision Maker Level',
      signed_contract_date: 'Signed Contract Date',
      implementation_start_date: 'Implementation Start Date',
      handoff_status: 'Handoff Status',
    };
    return labels[field] || field;
  };

  const getStringValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val);
  };

  const handleNumericChange = (fieldName: string, inputValue: string) => {
    console.log(`=== NUMERIC FIELD CHANGE DEBUG ===`);
    console.log(`Field: ${fieldName}, Input value: "${inputValue}"`);
    
    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      console.log(`Setting ${fieldName} to 0 (empty input)`);
      onChange(fieldName, 0);
      return;
    }
    
    const numericValue = parseFloat(inputValue);
    if (isNaN(numericValue)) {
      console.log(`Invalid numeric value for ${fieldName}: "${inputValue}"`);
      onChange(fieldName, 0);
      return;
    }
    
    // For revenue fields, ensure positive values
    if (fieldName.includes('revenue') && numericValue < 0) {
      console.log(`Setting ${fieldName} to 0 (negative value not allowed)`);
      onChange(fieldName, 0);
      return;
    }
    
    console.log(`Setting ${fieldName} to ${numericValue}`);
    onChange(fieldName, numericValue);
  };

  const handleLeadSelect = (lead: any) => {
    console.log("Selected lead:", lead);
    
    // Auto-fill available fields based on lead data
    const updates: Partial<Deal> = {
      lead_name: lead.lead_name,
      customer_name: lead.company_name || '',
      region: lead.country || '',
    };

    // Update each field individually
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        onChange(key, value);
      }
    });

    // Get lead owner display name if available
    if (lead.created_by) {
      const fetchLeadOwner = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('admin-list-users');
          if (!error && data?.users) {
            const user = data.users.find((u: any) => u.id === lead.created_by);
            if (user) {
              onChange('lead_owner', user.user_metadata?.display_name || "Unknown");
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching user display name:", error);
        }
        
        // Fallback if user fetch fails
        onChange('lead_owner', "Unknown");
      };
      
      fetchLeadOwner();
    }

    if (onLeadSelect) {
      onLeadSelect(lead);
    }
  };

  const renderDatePicker = (fieldName: string, dateValue: any) => {
    const date = dateValue ? new Date(dateValue) : undefined;
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                const formattedDate = format(selectedDate, "yyyy-MM-dd");
                console.log(`Date field ${fieldName} update: setting to ${formattedDate}`);
                onChange(fieldName, formattedDate);
              } else {
                onChange(fieldName, '');
              }
            }}
            disabled={(date) => date > new Date()} // Disable future dates
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    );
  };

  const renderField = () => {
    switch (field) {
      case 'lead_name':
        return (
          <LeadSearchableDropdown
            value={getStringValue(value)}
            onValueChange={(val) => onChange(field, val)}
            onLeadSelect={handleLeadSelect}
            placeholder="Search and select a lead..."
          />
        );

      case 'lead_owner':
        return (
          <Input
            value={getStringValue(value)}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter lead owner name..."
          />
        );

      case 'priority':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => onChange(field, parseInt(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  Priority {num} {num === 1 ? '(Highest)' : num === 2 ? '(High)' : num === 3 ? '(Medium)' : num === 4 ? '(Low)' : '(Lowest)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'probability':
        return (
          <Select
            value={value ? value.toString() : ''}
            onValueChange={(val) => {
              console.log(`Probability update: setting to ${val}`);
              onChange(field, parseInt(val));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select probability" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(percent => (
                <SelectItem key={percent} value={percent.toString()}>
                  {percent}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'region':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => onChange(field, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {['EU', 'US', 'ASIA', 'Other'].map(region => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'customer_need':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => onChange(field, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer need" />
            </SelectTrigger>
            <SelectContent>
              {['Open', 'Ongoing', 'Done'].map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'customer_challenges':
      case 'business_value':
      case 'decision_maker_level':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => {
              console.log(`${field} update: setting to ${val}`);
              onChange(field, val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${getFieldLabel(field).toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {['Open', 'Ongoing', 'Done'].map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'relationship_strength':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => onChange(field, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship strength" />
            </SelectTrigger>
            <SelectContent>
              {['Low', 'Medium', 'High'].map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'budget':
        return (
          <Input
            type="number"
            step="0.01"
            min="0"
            value={getStringValue(value)}
            onChange={(e) => {
              console.log(`Budget update: setting to ${e.target.value}`);
              handleNumericChange(field, e.target.value);
            }}
            placeholder="Enter budget in euros..."
          />
        );

      case 'is_recurring':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => {
              console.log(`Is recurring update: setting to ${val}`);
              onChange(field, val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select recurring status" />
            </SelectTrigger>
            <SelectContent>
              {['Yes', 'No', 'Unclear'].map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'currency_type':
        return (
          <Select
            value={value?.toString() || 'EUR'}
            onValueChange={(val) => onChange(field, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: 'EUR', label: '€ EUR' },
                { value: 'USD', label: '$ USD' },
                { value: 'INR', label: '₹ INR' },
              ].map(currency => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'rfq_status':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => onChange(field, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select RFQ status" />
            </SelectTrigger>
            <SelectContent>
              {['Drafted', 'Submitted', 'Rejected', 'Accepted'].map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'handoff_status':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => {
              console.log(`Handoff status update: setting to ${val}`);
              onChange(field, val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select handoff status" />
            </SelectTrigger>
            <SelectContent>
              {['Not Started', 'In Progress', 'Complete'].map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'signed_contract_date':
      case 'implementation_start_date':
        return renderDatePicker(field, value);

      case 'expected_closing_date':
      case 'start_date':
      case 'end_date':
      case 'rfq_received_date':
      case 'proposal_due_date':
        return (
          <Input
            type="date"
            value={getStringValue(value)}
            onChange={(e) => {
              console.log(`Date field ${field} update: setting to ${e.target.value}`);
              onChange(field, e.target.value);
            }}
          />
        );

      case 'total_contract_value':
      case 'project_duration':
        return (
          <Input
            type="number"
            step="0.01"
            min="0"
            value={getStringValue(value)}
            onChange={(e) => {
              console.log(`RFQ numeric field ${field} update: setting to ${e.target.value}`);
              handleNumericChange(field, e.target.value);
            }}
            placeholder={field === 'project_duration' ? 'Enter duration in months...' : 'Enter value...'}
          />
        );

      case 'quarterly_revenue_q1':
      case 'quarterly_revenue_q2':
      case 'quarterly_revenue_q3':
      case 'quarterly_revenue_q4':
        return (
          <Input
            type="number"
            step="0.01"
            min="0"
            value={getStringValue(value)}
            onChange={(e) => {
              console.log(`Revenue field ${field} update: setting to ${e.target.value}`);
              handleNumericChange(field, e.target.value);
            }}
            placeholder="Enter quarterly revenue..."
          />
        );

      case 'total_revenue':
        return (
          <Input
            type="number"
            step="0.01"
            min="0"
            value={getStringValue(value)}
            onChange={(e) => {
              console.log(`Total revenue field ${field} update: setting to ${e.target.value}`);
              handleNumericChange(field, e.target.value);
            }}
            placeholder="Enter total revenue..."
          />
        );

      case 'duration':
      case 'revenue':
        return (
          <Input
            type="number"
            value={getStringValue(value)}
            onChange={(e) => handleNumericChange(field, e.target.value)}
          />
        );

      case 'internal_comment':
      case 'action_items':
      case 'closing':
      case 'won_reason':
      case 'lost_reason':
      case 'need_improvement':
      case 'drop_reason':
        return (
          <Textarea
            value={getStringValue(value)}
            onChange={(e) => {
              console.log(`Textarea field ${field} update: setting to ${e.target.value}`);
              onChange(field, e.target.value);
            }}
            rows={3}
            placeholder={`Enter ${getFieldLabel(field).toLowerCase()}...`}
          />
        );

      case 'fax':
        return (
          <Input
            type="tel"
            value={getStringValue(value)}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder={`Enter ${getFieldLabel(field).toLowerCase()}...`}
          />
        );

      default:
        return (
          <Input
            value={getStringValue(value)}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder={`Enter ${getFieldLabel(field).toLowerCase()}...`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label>{getFieldLabel(field)}</Label>
      {renderField()}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
