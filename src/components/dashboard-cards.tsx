interface DashboardCardsProps {
  totalKm: number;
  businessKm: number;
  businessPercent: number;
  tripCount: number;
  deductible: number;
}

export function DashboardCards({ totalKm, businessKm, businessPercent, tripCount, deductible }: DashboardCardsProps) {
  const cards = [
    { label: "Total Kilometres", value: totalKm.toLocaleString(), suffix: "km" },
    { label: "Business Kilometres", value: businessKm.toLocaleString(), suffix: "km" },
    { label: "Business Use", value: businessPercent.toFixed(1), suffix: "%" },
    { label: "Trips Logged", value: tripCount, suffix: "" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="p-5 border border-line rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-card"
          >
            <p className="text-xs font-medium text-fg-muted uppercase tracking-wider">{card.label}</p>
            <p className="text-3xl font-bold text-fg mt-1">{card.value}<span className="text-base text-fg-muted ml-1">{card.suffix}</span></p>
          </div>
        ))}
      </div>

      <div className="border border-line rounded-xl shadow-sm p-5 bg-card mb-6">
        <p className="text-xs font-medium text-fg-muted uppercase tracking-wider">Estimated Deduction (Scale of Costs)</p>
        <p className="text-3xl font-bold text-accent mt-1">R {deductible.toLocaleString()}</p>
      </div>
    </>
  );
}
