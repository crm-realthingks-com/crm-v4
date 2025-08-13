
import { Deal, DealStage, getRequiredFieldsForStage } from "@/types/deal";

export const validateField = (field: string, value: any, stage: DealStage, formData?: Partial<Deal>): boolean => {
  // Always return true - no validation
  return true;
};

export const validateRequiredFields = (formData: Partial<Deal>, stage: DealStage): boolean => {
  // Always return true - no validation
  console.log(`=== VALIDATION SKIPPED FOR ALL STAGES ===`);
  return true;
};

export const validateDateLogic = (formData: Partial<Deal>): { isValid: boolean; error?: string } => {
  // Always return valid - no date validation
  return { isValid: true };
};

export const validateRevenueSum = (formData: Partial<Deal>): { isValid: boolean; error?: string } => {
  // Always return valid - no revenue validation
  return { isValid: true };
};

export const getFieldErrors = (formData: Partial<Deal>, stage: DealStage): Record<string, string> => {
  // Always return empty errors - no field validation
  return {};
};
