import { createVehicle } from "@/actions/vehicles";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewVehiclePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-fg">Add Vehicle</h1>
      <form action={createVehicle} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">Make</label>
          <input name="make" required className="w-full border border-line rounded px-3 py-2 bg-input text-fg" placeholder="e.g. Toyota" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">Model</label>
          <input name="model" required className="w-full border border-line rounded px-3 py-2 bg-input text-fg" placeholder="e.g. Corolla" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">Year</label>
          <input name="year" type="number" required className="w-full border border-line rounded px-3 py-2 bg-input text-fg" placeholder="e.g. 2023" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">License Plate</label>
          <input name="licensePlate" className="w-full border border-line rounded px-3 py-2 bg-input text-fg" placeholder="Optional" />
        </div>
        <button type="submit" className="w-full bg-accent text-on-accent rounded py-2 hover:bg-accent-light transition-colors font-medium">
          Add Vehicle
        </button>
      </form>
    </div>
  );
}
