import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createTrip } from "@/actions/trips";

export default async function NewTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));
  if (userVehicles.length === 0) redirect("/vehicles/new");

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Log a Trip</h1>
      <form action={createTrip} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <select name="vehicleId" required className="w-full border rounded px-3 py-2">
            {userVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Odometer (km)</label>
            <input name="startOdometer" type="number" required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Odometer (km)</label>
            <input name="endOdometer" type="number" required className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Location</label>
          <input name="startLocation" required className="w-full border rounded px-3 py-2" placeholder="Address or place name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Location</label>
          <input name="endLocation" required className="w-full border rounded px-3 py-2" placeholder="Address or place name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Purpose of Trip</label>
          <textarea name="purpose" required className="w-full border rounded px-3 py-2" rows={2} placeholder="e.g. Client meeting in Cape Town" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trip Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="true" defaultChecked />
              Business
            </label>
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="false" />
              Private
            </label>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
          Log Trip
        </button>
      </form>
    </div>
  );
}
