import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userTrips = await db.select().from(trips)
    .where(eq(trips.userId, session.user.id))
    .orderBy(trips.date);
  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));
  const vehicleMap = new Map(userVehicles.map(v => [v.id, `${v.make} ${v.model}`]));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trips</h1>
        <Link href="/trips/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + Log Trip
        </Link>
      </div>
      {userTrips.length === 0 ? (
        <p className="text-gray-500">No trips yet. <Link href="/trips/new" className="text-blue-600">Log your first trip</Link></p>
      ) : (
        <div className="space-y-3">
          {userTrips.map((t) => (
            <Link
              key={t.id}
              href={`/trips/${t.id}`}
              className="block p-4 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{t.startLocation} → {t.endLocation}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{t.date} · {t.totalKm} km · {vehicleMap.get(t.vehicleId) || "Unknown"} · {t.purpose}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ml-3 whitespace-nowrap ${t.isBusiness ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {t.isBusiness ? "Business" : "Private"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
