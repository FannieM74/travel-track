export interface SarsRateBracket {
  vehicleValue: [number, number];
  fixedCost: number;
  fuelCost: number;
  maintenanceCost: number;
}

export const SARS_RATES_2025: SarsRateBracket[] = [
  { vehicleValue: [0, 100000], fixedCost: 31600, fuelCost: 1.60, maintenanceCost: 0.70 },
  { vehicleValue: [100001, 200000], fixedCost: 54600, fuelCost: 1.70, maintenanceCost: 0.80 },
  { vehicleValue: [200001, 300000], fixedCost: 78600, fuelCost: 1.80, maintenanceCost: 0.90 },
  { vehicleValue: [300001, 400000], fixedCost: 103000, fuelCost: 1.85, maintenanceCost: 1.05 },
  { vehicleValue: [400001, 500000], fixedCost: 129600, fuelCost: 1.90, maintenanceCost: 1.15 },
  { vehicleValue: [500001, Infinity], fixedCost: 129600, fuelCost: 1.95, maintenanceCost: 1.20 },
];

export function getRateBracket(vehicleValue: number): SarsRateBracket {
  return SARS_RATES_2025.find(
    (b) => vehicleValue >= b.vehicleValue[0] && vehicleValue <= b.vehicleValue[1]
  )!;
}
