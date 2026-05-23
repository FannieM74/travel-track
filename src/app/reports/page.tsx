import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles, vehicleOdometerReadings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentTaxYear } from "@/lib/tax-year";
import { calculateScaleOfCosts } from "@/lib/sars-calculator";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const taxYear = getCurrentTaxYear();
  const userId = session.user.id;
  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, userId));

  const reportData = await Promise.all(
    userVehicles.map(async (v) => {
      const vehicleTrips = await db.select().from(trips).where(
        and(eq(trips.vehicleId, v.id), eq(trips.taxYear, taxYear))
      );
      const [odometer] = await db.select().from(vehicleOdometerReadings).where(
        and(eq(vehicleOdometerReadings.vehicleId, v.id), eq(vehicleOdometerReadings.taxYear, taxYear))
      );

      const totalKm = odometer?.closingOdometer && odometer?.openingOdometer
        ? odometer.closingOdometer - odometer.openingOdometer
        : vehicleTrips.reduce((s, t) => s + t.totalKm, 0);

      const businessKm = vehicleTrips
        .filter((t) => t.isBusiness)
        .reduce((s, t) => s + t.totalKm, 0);

      const deduction = calculateScaleOfCosts(totalKm, businessKm, 250000);
      const tripCount = vehicleTrips.length;

      return { vehicle: v, odometer, totalKm, businessKm, tripCount, deduction };
    })
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2 text-fg">SARS Reports</h1>
      <p className="text-fg-secondary mb-6">Tax Year: {taxYear}/{taxYear + 1}</p>

      {reportData.length === 0 ? (
        <p className="text-fg-secondary">Add vehicles and log trips to generate reports.</p>
      ) : (
        <div className="space-y-6">
          {reportData.map((r) => (
            <div key={r.vehicle.id} className="border border-line rounded-xl bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-1 text-fg">
                {r.vehicle.make} {r.vehicle.model} ({r.vehicle.year})
              </h2>
              <p className="text-sm text-fg-secondary mb-4">{r.vehicle.licensePlate}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-fg-secondary">Opening (1 Mar)</p>
                  <p className="font-bold text-fg">{r.odometer?.openingOdometer?.toLocaleString() || "—"} km</p>
                </div>
                <div>
                  <p className="text-sm text-fg-secondary">Closing (28 Feb)</p>
                  <p className="font-bold text-fg">{r.odometer?.closingOdometer?.toLocaleString() || "—"} km</p>
                </div>
                <div>
                  <p className="text-sm text-fg-secondary">Total Kilometres</p>
                  <p className="font-bold text-fg">{r.totalKm.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-sm text-fg-secondary">Business Kilometres</p>
                  <p className="font-bold text-fg">{r.businessKm.toLocaleString()} km</p>
                </div>
              </div>

              <div className="bg-panel p-4 rounded-lg border border-line">
                <h3 className="font-semibold mb-2 text-fg">Scale of Costs — Estimated Deduction</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-fg-secondary">Fixed Cost</p>
                    <p className="font-bold text-fg">R {r.deduction.fixedCostDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-fg-secondary">Fuel</p>
                    <p className="font-bold text-fg">R {r.deduction.fuelDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-fg-secondary">Maintenance</p>
                    <p className="font-bold text-fg">R {r.deduction.maintenanceDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-fg-secondary">Total</p>
                    <p className="font-bold text-lg text-accent">R {r.deduction.totalDeduction.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <a
                  href={`/api/reports/${taxYear}/${r.vehicle.id}/pdf`}
                  className="inline-block bg-accent text-on-accent px-4 py-2 rounded hover:bg-accent-light transition-colors font-medium"
                >
                  Download PDF Logbook
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
