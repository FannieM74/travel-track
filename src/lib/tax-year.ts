export function getCurrentTaxYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 3 ? year : year - 1;
}

export function getTaxYearRange(taxYear: number): { start: Date; end: Date } {
  return {
    start: new Date(taxYear, 2, 1),
    end: new Date(taxYear + 1, 1, 28),
  };
}

export function computeTaxYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 3 ? year : year - 1;
}
