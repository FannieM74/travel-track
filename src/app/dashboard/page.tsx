import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentTaxYear } from "@/lib/tax-year";
import { DashboardCards } from "@/components/dashboard-cards";
import { RecentTrips } from "@/components/recent-trips";
import { MonthlyChart } from "@/components/monthly-chart";
import { calculateScaleOfCosts } from "@/lib/sars-calculator";
import Link from "next/link";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getTaxYearMonths(taxYear: number) {
  return [
    { year: taxYear, month: 2 },  // Mar
    { year: taxYear, month: 3 },  // Apr
    { year: taxYear, month: 4 },  // May
    { year: taxYear, month: 5 },  // Jun
    { year: taxYear, month: 6 },  // Jul
    { year: taxYear, month: 7 },  // Aug
    { year: taxYear, month: 8 },  // Sep
    { year: taxYear, month: 9 },  // Oct
    { year: taxYear, month: 10 }, // Nov
    { year: taxYear, month: 11 }, // Dec
    { year: taxYear + 1, month: 0 }, // Jan
    { year: taxYear + 1, month: 1 }, // Feb
  ];
}

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
  const deductible = calculateScaleOfCosts(totalKm, businessKm, 250000).totalDeduction;

  const recentTrips = yearTrips
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const vehicleList = await db.select().from(vehicles).where(eq(vehicles.userId, userId));

  const monthlyChartData = getTaxYearMonths(taxYear).map(({ year, month }) => {
    const monthTrips = yearTrips.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const total = monthTrips.reduce((s, t) => s + t.totalKm, 0);
    const business = monthTrips.filter(t => t.isBusiness).reduce((s, t) => s + t.totalKm, 0);
    return { month: MONTHS[month], total, business };
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-fg">Dashboard</h1>
        <Link href="/trips/new" className="bg-accent text-on-accent px-4 py-2 rounded-lg hover:bg-accent-light transition-colors font-medium">
          + Log Trip
        </Link>
      </div>

      <p className="text-sm text-fg-secondary mb-4">Tax Year: {taxYear}/{taxYear + 1}</p>
      <DashboardCards totalKm={totalKm} businessKm={businessKm} businessPercent={businessPercent} tripCount={tripCount} deductible={deductible} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MonthlyChart data={monthlyChartData} />
        <div>
          <h2 className="text-sm font-semibold text-fg mb-3">Recent Trips</h2>
          <RecentTrips trips={recentTrips} />
        </div>
      </div>

      <h2 className="text-sm font-semibold text-fg mb-3">Vehicles</h2>
      {vehicleList.length === 0 ? (
        <p className="text-fg-secondary">No vehicles added. <Link href="/vehicles/new" className="text-accent">Add a vehicle</Link></p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vehicleList.map((v) => (
            <div key={v.id} className="p-3 border border-line rounded-xl bg-card">
              <p className="font-medium text-fg">{v.make} {v.model} ({v.year})</p>
              <p className="text-sm text-fg-secondary">{v.licensePlate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
