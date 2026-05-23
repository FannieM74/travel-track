interface DashboardCardsProps {
  totalKm: number;
  businessKm: number;
  businessPercent: number;
  tripCount: number;
}

export function DashboardCards({ totalKm, businessKm, businessPercent, tripCount }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Total Kilometres</p>
        <p className="text-2xl font-bold">{totalKm.toLocaleString()}</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Business Kilometres</p>
        <p className="text-2xl font-bold">{businessKm.toLocaleString()}</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Business Use</p>
        <p className="text-2xl font-bold">{businessPercent.toFixed(1)}%</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Trips Logged</p>
        <p className="text-2xl font-bold">{tripCount}</p>
      </div>
    </div>
  );
}
