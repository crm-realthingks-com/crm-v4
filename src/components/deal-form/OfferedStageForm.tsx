
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deal } from "@/types/deal";
import { FormFieldRenderer } from "./FormFieldRenderer";

interface OfferedStageFormProps {
  formData: Partial<Deal>;
  onFieldChange: (field: string, value: any) => void;
  fieldErrors: Record<string, string>;
}

export const OfferedStageForm = ({ formData, onFieldChange, fieldErrors }: OfferedStageFormProps) => {
  // Only require these specific fields for Offered stage validation
  const requiredFields = ['business_value', 'decision_maker_level', 'current_status', 'closing'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Offered Stage</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete these required fields to move to final stages (Won, Lost, Dropped)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredFields.map(field => (
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
