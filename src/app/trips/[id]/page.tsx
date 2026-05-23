import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateTrip, deleteTrip } from "@/actions/trips";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const { id } = await params;

  const [trip] = await db.select().from(trips).where(
    and(eq(trips.id, id), eq(trips.userId, session.user.id))
  );
  if (!trip) notFound();

  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Trip</h1>
      <form action={updateTrip.bind(null, id)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input name="date" type="date" required defaultValue={trip.date}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <select name="vehicleId" required defaultValue={trip.vehicleId} className="w-full border rounded px-3 py-2">
            {userVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.make} {v.model}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Odometer (km)</label>
            <input name="startOdometer" type="number" required defaultValue={trip.startOdometer}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Odometer (km)</label>
            <input name="endOdometer" type="number" required defaultValue={trip.endOdometer}
              className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Location</label>
          <input name="startLocation" required defaultValue={trip.startLocation}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Location</label>
          <input name="endLocation" required defaultValue={trip.endLocation}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Purpose</label>
          <textarea name="purpose" required defaultValue={trip.purpose}
            className="w-full border rounded px-3 py-2" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trip Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="true" defaultChecked={trip.isBusiness} />
              Business
            </label>
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="false" defaultChecked={!trip.isBusiness} />
              Private
            </label>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
          Update Trip
        </button>
      </form>

      <form action={deleteTrip.bind(null, id)} className="mt-4">
        <button type="submit" className="w-full border border-red-300 text-red-600 rounded py-2 hover:bg-red-50">
          Delete Trip
        </button>
      </form>
    </div>
  );
}
