import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentTaxYear } from "@/lib/tax-year";
import { DashboardCards } from "@/components/dashboard-cards";
import { RecentTrips } from "@/components/recent-trips";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const taxYear = getCurrentTaxYear();
  const userId = session.user.id;

  const yearTrips = await db.select().from(trips).where(
    and(eq(trips.userId, userId), eq(trips.taxYear, taxYear))
  );

  const totalKm = yearTrips.reduce((sum, t) => sum + t.totalKm, 0);
  const businessKm = yearTrips.filter(t => t.isBusiness).reduce((sum, t) => sum + t.totalKm, 0);
  const businessPercent = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;
  const tripCount = yearTrips.length;
  const recentTrips = yearTrips
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const vehicleList = await db.select().from(vehicles).where(eq(vehicles.userId, userId));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/trips/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Log Trip
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-4">Tax Year: {taxYear}/{taxYear + 1}</p>
      <DashboardCards totalKm={totalKm} businessKm={businessKm} businessPercent={businessPercent} tripCount={tripCount} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Trips</h2>
          <RecentTrips trips={recentTrips} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">Vehicles</h2>
          {vehicleList.length === 0 ? (
            <p className="text-gray-500">No vehicles added. <Link href="/vehicles/new" className="text-blue-600">Add a vehicle</Link></p>
          ) : (
            <div className="space-y-2">
              {vehicleList.map((v) => (
                <div key={v.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{v.make} {v.model} ({v.year})</p>
                  <p className="text-sm text-gray-500">{v.licensePlate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
