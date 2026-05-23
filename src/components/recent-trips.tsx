import Link from "next/link";

interface Trip {
  id: string;
  date: string;
  startLocation: string;
  endLocation: string;
  totalKm: number;
  purpose: string;
}

export function RecentTrips({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) {
    return <p className="text-gray-500">No trips logged yet. <Link href="/trips/new" className="text-blue-600">Log your first trip</Link></p>;
  }
  return (
    <div className="space-y-2">
      {trips.map((trip) => (
        <Link
          key={trip.id}
          href={`/trips/${trip.id}`}
          className="block p-4 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{trip.startLocation} → {trip.endLocation}</p>
              <p className="text-sm text-gray-500 mt-0.5">{trip.date} — {trip.purpose}</p>
            </div>
            <span className="text-sm font-semibold text-gray-700 ml-3 whitespace-nowrap">{trip.totalKm} km</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
