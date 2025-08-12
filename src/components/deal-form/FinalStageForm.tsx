
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deal, DealStage } from "@/types/deal";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { useEffect } from "react";

interface FinalStageFormProps {
  formData: Partial<Deal>;
  onFieldChange: (field: string, value: any) => void;
  fieldErrors: Record<string, string>;
  stage: DealStage;
}

export const FinalStageForm = ({ formData, onFieldChange, fieldErrors, stage }: FinalStageFormProps) => {
  // Auto-calculate total_revenue when quarterly revenues change (Won stage only)
  useEffect(() => {
    if (stage === 'Won') {
      const q1 = Number(formData.quarterly_revenue_q1) || 0;
      const q2 = Number(formData.quarterly_revenue_q2) || 0;
      const q3 = Number(formData.quarterly_revenue_q3) || 0;
      const q4 = Number(formData.quarterly_revenue_q4) || 0;
      
      const totalRevenue = q1 + q2 + q3 + q4;
      
      // Only update if quarterly revenues are filled and total doesn't match
      if ((q1 > 0 || q2 > 0 || q3 > 0 || q4 > 0) && totalRevenue !== (Number(formData.total_revenue) || 0)) {
        onFieldChange('total_revenue', totalRevenue);
      }
    }
  }, [formData.quarterly_revenue_q1, formData.quarterly_revenue_q2, formData.quarterly_revenue_q3, formData.quarterly_revenue_q4, formData.total_revenue, onFieldChange, stage]);

  const getFieldsForStage = (stage: DealStage) => {
    switch (stage) {
      case 'Won':
        return ['won_reason', 'quarterly_revenue_q1', 'quarterly_revenue_q2', 'quarterly_revenue_q3', 'quarterly_revenue_q4', 'total_revenue', 'signed_contract_date', 'implementation_start_date', 'handoff_status'];
      case 'Lost':
        return ['lost_reason', 'need_improvement'];
      case 'Dropped':
        return ['drop_reason'];
      default:
        return [];
    }
  };

  const fields = getFieldsForStage(stage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{stage} Stage</CardTitle>
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
