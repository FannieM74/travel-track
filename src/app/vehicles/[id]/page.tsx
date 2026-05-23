import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { vehicles, vehicleOdometerReadings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentTaxYear } from "@/lib/tax-year";
import { updateVehicle, deleteVehicle, setOpeningOdometer, setClosingOdometer } from "@/actions/vehicles";
import Link from "next/link";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const { id } = await params;

  const [vehicle] = await db.select().from(vehicles).where(
    and(eq(vehicles.id, id), eq(vehicles.userId, session.user.id))
  );
  if (!vehicle) notFound();

  const taxYear = getCurrentTaxYear();
  const [odometer] = await db.select().from(vehicleOdometerReadings).where(
    and(eq(vehicleOdometerReadings.vehicleId, id), eq(vehicleOdometerReadings.taxYear, taxYear))
  );

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{vehicle.make} {vehicle.model}</h1>
      <p className="text-gray-500 mb-6">{vehicle.licensePlate || "No plate"} · {vehicle.year}</p>

      <h2 className="font-semibold mb-3">Tax Year {taxYear}/{taxYear + 1} Odometer</h2>

      <form action={setOpeningOdometer.bind(null, id)} className="border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-3">Set Opening Odometer (1 March)</h3>
        <input type="hidden" name="taxYear" value={taxYear} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Odometer Reading (km)</label>
            <input name="openingOdometer" type="number" required defaultValue={odometer?.openingOdometer || ""}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input name="openingDate" type="date" required defaultValue={odometer?.openingDate || `${taxYear}-03-01`}
              className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Opening Reading
        </button>
      </form>

      <form action={setClosingOdometer.bind(null, id)} className="border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-3">Set Closing Odometer (28 February)</h3>
        <input type="hidden" name="taxYear" value={taxYear} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Odometer Reading (km)</label>
            <input name="closingOdometer" type="number" required defaultValue={odometer?.closingOdometer || ""}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input name="closingDate" type="date" required defaultValue={odometer?.closingDate || `${taxYear + 1}-02-28`}
              className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Closing Reading
        </button>
      </form>

      <h2 className="font-semibold mb-3 mt-6">Edit Vehicle Details</h2>
      <form action={updateVehicle.bind(null, id)} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Make</label>
          <input name="make" defaultValue={vehicle.make} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input name="model" defaultValue={vehicle.model} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input name="year" type="number" defaultValue={vehicle.year} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">License Plate</label>
          <input name="licensePlate" defaultValue={vehicle.licensePlate || ""} className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
          Update Vehicle
        </button>
      </form>

      <form action={deleteVehicle.bind(null, id)}>
        <button type="submit" className="w-full border border-red-300 text-red-600 rounded py-2 hover:bg-red-50">
          Delete Vehicle
        </button>
      </form>

      <Link href="/vehicles" className="block mt-4 text-sm text-gray-500 hover:underline">← Back to vehicles</Link>
    </div>
  );
}
