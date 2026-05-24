import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { TripFilters } from "@/components/trip-filters";

export default async function TripsPage({
  searchParams
}: {
  searchParams: { vehicleId?: string; type?: string; dateFrom?: string; dateTo?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const tripsList = await db.select().from(trips).where(eq(trips.userId, session.user.id));

  let filtered = [...tripsList];

  if (searchParams.vehicleId) {
    filtered = filtered.filter(t => t.vehicleId === searchParams.vehicleId);
  }

  if (searchParams.type === "business") {
    filtered = filtered.filter(t => t.isBusiness);
  } else if (searchParams.type === "private") {
    filtered = filtered.filter(t => !t.isBusiness);
  }

  const dateFrom = searchParams.dateFrom;
  if (dateFrom) {
    filtered = filtered.filter(t => t.date >= dateFrom);
  }

  const dateTo = searchParams.dateTo;
  if (dateTo) {
    filtered = filtered.filter(t => t.date <= dateTo);
  }

  filtered = filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const vehicleIds = [...new Set(tripsList.map(t => t.vehicleId))];
  const userVehicles = vehicleIds.length > 0
    ? await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id))
    : [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-fg">Trips</h1>
        <div className="flex gap-2">
          <a href="/api/trips/csv" className="border border-line text-fg-secondary px-4 py-2 rounded-lg hover:bg-input transition-colors text-sm font-medium">
            Export CSV
          </a>
          <Link href="/trips/new" className="bg-accent text-on-accent px-4 py-2 rounded-lg hover:bg-accent-light transition-colors font-medium">
            + Log Trip
          </Link>
        </div>
      </div>

      <TripFilters
        filters={{
          vehicleId: searchParams.vehicleId || "",
          type: searchParams.type as 'business' | 'private' | undefined,
          startDate: searchParams.dateFrom || "",
          endDate: searchParams.dateTo || "",
        }}
        vehicles={userVehicles}
        tripsCount={tripsList.length}
      />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-fg-secondary">No trips found. <Link href="/trips/new" className="text-accent">Log your first trip</Link></p>
        ) : (
          filtered.map((t) => (
            <Link
              key={t.id}
              href={`/trips/${t.id}`}
              className="block p-4 border border-line rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-card"
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg truncate">{t.startLocation} → {t.endLocation}</p>
                  <p className="text-sm text-fg-secondary mt-0.5">{t.date} · {t.totalKm} km · {t.purpose}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ml-3 whitespace-nowrap ${t.isBusiness ? "bg-success/10 text-success" : "bg-fg-muted/10 text-fg-secondary"}`}>
                  {t.isBusiness ? "Business" : "Private"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
