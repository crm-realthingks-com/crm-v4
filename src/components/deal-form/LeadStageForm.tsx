
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deal } from "@/types/deal";
import { FormFieldRenderer } from "./FormFieldRenderer";

interface LeadStageFormProps {
  formData: Partial<Deal>;
  onFieldChange: (field: string, value: any) => void;
  onLeadSelect?: (lead: any) => void;
  fieldErrors: Record<string, string>;
}

export const LeadStageForm = ({ formData, onFieldChange, onLeadSelect, fieldErrors }: LeadStageFormProps) => {
  const fields = ['project_name', 'lead_name', 'customer_name', 'region', 'lead_owner', 'priority'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lead Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(field => (
            <FormFieldRenderer
              key={field}
              field={field}
              value={formData[field as keyof Deal]}
              onChange={onFieldChange}
              onLeadSelect={onLeadSelect}
              error={fieldErrors[field]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
