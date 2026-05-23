import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function VehiclesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Link href="/vehicles/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Add Vehicle
        </Link>
      </div>
      {userVehicles.length === 0 ? (
        <p className="text-gray-500">No vehicles yet. <Link href="/vehicles/new" className="text-blue-600">Add your first vehicle</Link></p>
      ) : (
        <div className="grid gap-4">
          {userVehicles.map((v) => (
            <div key={v.id} className="p-4 border rounded-lg flex justify-between items-center">
              <div>
                <p className="font-medium">{v.make} {v.model} ({v.year})</p>
                <p className="text-sm text-gray-500">{v.licensePlate || "No plate"}</p>
              </div>
              <Link href={`/vehicles/${v.id}`} className="text-sm text-blue-600 hover:underline">Edit</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
