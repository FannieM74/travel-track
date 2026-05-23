import { createVehicle } from "@/actions/vehicles";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewVehiclePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add Vehicle</h1>
      <form action={createVehicle} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Make</label>
          <input name="make" required className="w-full border rounded px-3 py-2" placeholder="e.g. Toyota" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input name="model" required className="w-full border rounded px-3 py-2" placeholder="e.g. Corolla" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input name="year" type="number" required className="w-full border rounded px-3 py-2" placeholder="e.g. 2023" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">License Plate</label>
          <input name="licensePlate" className="w-full border rounded px-3 py-2" placeholder="Optional" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
          Add Vehicle
        </button>
      </form>
    </div>
  );
}
