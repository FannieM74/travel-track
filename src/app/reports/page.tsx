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
      <h1 className="text-2xl font-bold mb-2">SARS Reports</h1>
      <p className="text-gray-500 mb-6">Tax Year: {taxYear}/{taxYear + 1}</p>

      {reportData.length === 0 ? (
        <p className="text-gray-500">Add vehicles and log trips to generate reports.</p>
      ) : (
        <div className="space-y-6">
          {reportData.map((r) => (
            <div key={r.vehicle.id} className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-1">
                {r.vehicle.make} {r.vehicle.model} ({r.vehicle.year})
              </h2>
              <p className="text-sm text-gray-500 mb-4">{r.vehicle.licensePlate}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Opening (1 Mar)</p>
                  <p className="font-bold">{r.odometer?.openingOdometer?.toLocaleString() || "—"} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Closing (28 Feb)</p>
                  <p className="font-bold">{r.odometer?.closingOdometer?.toLocaleString() || "—"} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Kilometres</p>
                  <p className="font-bold">{r.totalKm.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Kilometres</p>
                  <p className="font-bold">{r.businessKm.toLocaleString()} km</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Scale of Costs — Estimated Deduction</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Fixed Cost</p>
                    <p className="font-bold">R {r.deduction.fixedCostDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fuel</p>
                    <p className="font-bold">R {r.deduction.fuelDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Maintenance</p>
                    <p className="font-bold">R {r.deduction.maintenanceDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-lg">R {r.deduction.totalDeduction.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <a
                  href={`/api/reports/${taxYear}/${r.vehicle.id}/pdf`}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
