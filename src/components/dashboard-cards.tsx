interface DashboardCardsProps {
  totalKm: number;
  businessKm: number;
  businessPercent: number;
  tripCount: number;
}

export function DashboardCards({ totalKm, businessKm, businessPercent, tripCount }: DashboardCardsProps) {
  const cards = [
    { label: "Total Kilometres", value: totalKm.toLocaleString(), suffix: "km" },
    { label: "Business Kilometres", value: businessKm.toLocaleString(), suffix: "km" },
    { label: "Business Use", value: businessPercent.toFixed(1), suffix: "%" },
    { label: "Trips Logged", value: tripCount, suffix: "" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div
          key={i}
          className="p-5 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
          <p className="text-3xl font-bold mt-1">{card.value}<span className="text-base text-gray-400 ml-1">{card.suffix}</span></p>
        </div>
      ))}
    </div>
  );
}
