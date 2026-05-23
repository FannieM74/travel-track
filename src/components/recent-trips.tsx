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
        <Link key={trip.id} href={`/trips/${trip.id}`} className="block p-3 border rounded-lg hover:bg-gray-50">
          <div className="flex justify-between">
            <span className="font-medium">{trip.startLocation} → {trip.endLocation}</span>
            <span className="text-sm text-gray-500">{trip.totalKm} km</span>
          </div>
          <p className="text-sm text-gray-500">{trip.date} — {trip.purpose}</p>
        </Link>
      ))}
    </div>
  );
}
