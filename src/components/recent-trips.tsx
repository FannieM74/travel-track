import Link from "next/link";

interface Trip {
  id: string;
  date: string;
  startLocation: string;
  endLocation: string;
  totalKm: number;
  purpose: string;
  isBusiness: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export function RecentTrips({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) {
    return <p className="text-fg-secondary">No trips logged yet. <Link href="/trips/new" className="text-accent">Log your first trip</Link></p>;
  }
  return (
    <div className="space-y-2">
      {trips.map((trip) => (
        <Link
          key={trip.id}
          href={`/trips/${trip.id}`}
          className="block p-4 border border-line rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-card"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-sm text-fg-secondary">{formatDate(trip.date)}</span>
            <span className="text-sm font-semibold text-fg-secondary whitespace-nowrap">{trip.totalKm} km</span>
          </div>
          <p className="text-sm text-fg"><span className="text-fg-secondary">Start:</span> {trip.startLocation}</p>
          <p className="text-sm text-fg"><span className="text-fg-secondary">End:</span> {trip.endLocation}</p>
          {trip.isBusiness && (
            <p className="text-sm text-fg mt-0.5"><span className="text-fg-secondary">Business:</span> {trip.purpose}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
