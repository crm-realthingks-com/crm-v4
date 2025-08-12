
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deal } from "@/types/deal";
import { FormFieldRenderer } from "./FormFieldRenderer";

interface OfferedStageFormProps {
  formData: Partial<Deal>;
  onFieldChange: (field: string, value: any) => void;
  fieldErrors: Record<string, string>;
}

export const OfferedStageForm = ({ formData, onFieldChange, fieldErrors }: OfferedStageFormProps) => {
  const fields = ['business_value', 'decision_maker_level', 'current_status', 'closing'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Offered Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
