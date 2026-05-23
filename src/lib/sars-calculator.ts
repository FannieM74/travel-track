import { getRateBracket } from "./sars-rates";

export interface SarsDeductionResult {
  totalKm: number;
  businessKm: number;
  businessPercent: number;
  fixedCostDeduction: number;
  fuelDeduction: number;
  maintenanceDeduction: number;
  totalDeduction: number;
}

export function calculateScaleOfCosts(
  totalKm: number,
  businessKm: number,
  vehicleValue: number,
): SarsDeductionResult {
  const bracket = getRateBracket(vehicleValue);
  const businessPercent = totalKm > 0 ? businessKm / totalKm : 0;

  const fixedCostDeduction = Math.round(bracket.fixedCost * businessPercent);
  const fuelDeduction = Math.round(businessKm * bracket.fuelCost);
  const maintenanceDeduction = Math.round(businessKm * bracket.maintenanceCost);
  const totalDeduction = fixedCostDeduction + fuelDeduction + maintenanceDeduction;

  return {
    totalKm,
    businessKm,
    businessPercent: Math.round(businessPercent * 100 * 10) / 10,
    fixedCostDeduction,
    fuelDeduction,
    maintenanceDeduction,
    totalDeduction,
  };
}
