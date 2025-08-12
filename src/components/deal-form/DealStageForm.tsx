
import { Deal, DealStage } from "@/types/deal";
import { LeadStageForm } from "./LeadStageForm";
import { DiscussionsStageForm } from "./DiscussionsStageForm";
import { QualifiedStageForm } from "./QualifiedStageForm";
import { RFQStageForm } from "./RFQStageForm";
import { OfferedStageForm } from "./OfferedStageForm";
import { FinalStageForm } from "./FinalStageForm";

interface DealStageFormProps {
  formData: Partial<Deal>;
  onFieldChange: (field: string, value: any) => void;
  onLeadSelect?: (lead: any) => void;
  fieldErrors: Record<string, string>;
  stage: DealStage;
  showPreviousStages: boolean;
}

export const DealStageForm = ({ 
  formData, 
  onFieldChange, 
  onLeadSelect, 
  fieldErrors, 
  stage, 
  showPreviousStages 
}: DealStageFormProps) => {
  const getStageIndex = (stage: DealStage): number => {
    const stages = ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];
    return stages.indexOf(stage);
  };

  const currentStageIndex = getStageIndex(stage);
  const isFinalStage = ['Won', 'Lost', 'Dropped'].includes(stage);

  const renderStageComponent = (stageToRender: DealStage) => {
    switch (stageToRender) {
      case 'Lead':
        return (
          <LeadStageForm
            formData={formData}
            onFieldChange={onFieldChange}
            onLeadSelect={onLeadSelect}
            fieldErrors={fieldErrors}
          />
        );
      case 'Discussions':
        return (
          <DiscussionsStageForm
            formData={formData}
            onFieldChange={onFieldChange}
            fieldErrors={fieldErrors}
          />
        );
      case 'Qualified':
        return (
          <QualifiedStageForm
            formData={formData}
            onFieldChange={onFieldChange}
            fieldErrors={fieldErrors}
          />
        );
      case 'RFQ':
        return (
          <RFQStageForm
            formData={formData}
            onFieldChange={onFieldChange}
            fieldErrors={fieldErrors}
          />
        );
      case 'Offered':
        return (
          <OfferedStageForm
            formData={formData}
            onFieldChange={onFieldChange}
            fieldErrors={fieldErrors}
          />
        );
      case 'Won':
      case 'Lost':
      case 'Dropped':
        return (
          <FinalStageForm
            formData={formData}
            onFieldChange={onFieldChange}
            fieldErrors={fieldErrors}
            stage={stageToRender}
          />
        );
      default:
        return null;
    }
  };

  if (showPreviousStages) {
    // Show all stages up to current stage
    const stagesToShow: DealStage[] = [];
    const allStages: DealStage[] = ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered'];
    
    if (isFinalStage) {
      // For final stages, show all previous stages plus the final stage
      stagesToShow.push(...allStages);
      stagesToShow.push(stage);
    } else {
      // For regular stages, show all stages up to current
      for (let i = 0; i <= currentStageIndex && i < allStages.length; i++) {
        stagesToShow.push(allStages[i]);
      }
    }

    return (
      <div className="space-y-6">
        {stagesToShow.map(stageToRender => (
          <div key={stageToRender}>
            {renderStageComponent(stageToRender)}
          </div>
        ))}
      </div>
    );
  } else {
    // Show only current stage
    return (
      <div>
        {renderStageComponent(stage)}
      </div>
    );
  }
};
