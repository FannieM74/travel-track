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
        <h1 className="text-2xl font-bold text-fg">Trips</h1>
        <Link href="/trips/new" className="bg-accent text-on-accent px-4 py-2 rounded-lg hover:bg-accent-light transition-colors font-medium">
          + Log Trip
        </Link>
      </div>
      {userTrips.length === 0 ? (
        <p className="text-fg-secondary">No trips yet. <Link href="/trips/new" className="text-accent">Log your first trip</Link></p>
      ) : (
        <div className="space-y-3">
          {userTrips.map((t) => (
            <Link
              key={t.id}
              href={`/trips/${t.id}`}
              className="block p-4 border border-line rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-card"
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg truncate">{t.startLocation} → {t.endLocation}</p>
                  <p className="text-sm text-fg-secondary mt-0.5">{t.date} · {t.totalKm} km · {vehicleMap.get(t.vehicleId) || "Unknown"} · {t.purpose}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ml-3 whitespace-nowrap ${t.isBusiness ? "bg-success/10 text-success" : "bg-fg-muted/10 text-fg-secondary"}`}>
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
