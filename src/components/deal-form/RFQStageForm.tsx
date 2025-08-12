
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deal } from "@/types/deal";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { useEffect } from "react";

interface RFQStageFormProps {
  formData: Partial<Deal>;
  onFieldChange: (field: string, value: any) => void;
  fieldErrors: Record<string, string>;
}

export const RFQStageForm = ({ formData, onFieldChange, fieldErrors }: RFQStageFormProps) => {
  // Auto-calculate project_duration when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (startDate <= endDate) {
        // Calculate months between dates
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
        
        if (months !== (Number(formData.project_duration) || 0)) {
          onFieldChange('project_duration', months);
        }
      }
    }
  }, [formData.start_date, formData.end_date, formData.project_duration, onFieldChange]);

  const fields = [
    'total_contract_value',
    'currency_type',
    'start_date', 
    'end_date',
    'project_duration',
    'rfq_received_date',
    'proposal_due_date',
    'rfq_status',
    'action_items',
    'internal_comment'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">RFQ Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(field => (
            <FormFieldRenderer
              key={field}
              field={field}
              value={formData[field as keyof Deal]}
              onChange={onFieldChange}
              error={fieldErrors[field]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
