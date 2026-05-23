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
      <h1 className="text-2xl font-bold mb-2 text-fg">{vehicle.make} {vehicle.model}</h1>
      <p className="text-fg-secondary mb-6">{vehicle.licensePlate || "No plate"} · {vehicle.year}</p>

      <h2 className="font-semibold mb-3 text-fg">Tax Year {taxYear}/{taxYear + 1} Odometer</h2>

      <form action={setOpeningOdometer.bind(null, id)} className="border border-line rounded-xl p-4 bg-card mb-4">
        <h3 className="font-semibold mb-3 text-fg">Set Opening Odometer (1 March)</h3>
        <input type="hidden" name="taxYear" value={taxYear} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-fg">Odometer Reading (km)</label>
            <input name="openingOdometer" type="number" required defaultValue={odometer?.openingOdometer || ""}
              className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-fg">Date</label>
            <input name="openingDate" type="date" required defaultValue={odometer?.openingDate || `${taxYear}-03-01`}
              className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
          </div>
        </div>
        <button type="submit" className="mt-2 bg-accent text-on-accent px-4 py-2 rounded hover:bg-accent-light transition-colors font-medium">
          Save Opening Reading
        </button>
      </form>

      <form action={setClosingOdometer.bind(null, id)} className="border border-line rounded-xl p-4 bg-card mb-4">
        <h3 className="font-semibold mb-3 text-fg">Set Closing Odometer (28 February)</h3>
        <input type="hidden" name="taxYear" value={taxYear} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-fg">Odometer Reading (km)</label>
            <input name="closingOdometer" type="number" required defaultValue={odometer?.closingOdometer || ""}
              className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-fg">Date</label>
            <input name="closingDate" type="date" required defaultValue={odometer?.closingDate || `${taxYear + 1}-02-28`}
              className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
          </div>
        </div>
        <button type="submit" className="mt-2 bg-accent text-on-accent px-4 py-2 rounded hover:bg-accent-light transition-colors font-medium">
          Save Closing Reading
        </button>
      </form>

      <h2 className="font-semibold mb-3 mt-6 text-fg">Edit Vehicle Details</h2>
      <form action={updateVehicle.bind(null, id)} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">Make</label>
          <input name="make" defaultValue={vehicle.make} required className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">Model</label>
          <input name="model" defaultValue={vehicle.model} required className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">Year</label>
          <input name="year" type="number" defaultValue={vehicle.year} required className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">License Plate</label>
          <input name="licensePlate" defaultValue={vehicle.licensePlate || ""} className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
        </div>
        <button type="submit" className="w-full bg-accent text-on-accent rounded py-2 hover:bg-accent-light transition-colors font-medium">
          Update Vehicle
        </button>
      </form>

      <form action={deleteVehicle.bind(null, id)}>
        <button type="submit" className="w-full border border-line rounded py-2 text-danger hover:bg-card-hover transition-colors">
          Delete Vehicle
        </button>
      </form>

      <Link href="/vehicles" className="block mt-4 text-sm text-fg-secondary hover:underline">← Back to vehicles</Link>
    </div>
  );
}
