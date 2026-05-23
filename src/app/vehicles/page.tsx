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
        <h1 className="text-2xl font-bold text-fg">Vehicles</h1>
        <Link href="/vehicles/new" className="bg-accent text-on-accent px-4 py-2 rounded-lg hover:bg-accent-light transition-colors font-medium">
          + Add Vehicle
        </Link>
      </div>
      {userVehicles.length === 0 ? (
        <p className="text-fg-secondary">No vehicles yet. <Link href="/vehicles/new" className="text-accent">Add your first vehicle</Link></p>
      ) : (
        <div className="grid gap-4">
          {userVehicles.map((v) => (
            <div key={v.id} className="p-4 border border-line rounded-xl bg-card shadow-sm flex justify-between items-center">
              <div>
                <p className="font-medium text-fg">{v.make} {v.model} ({v.year})</p>
                <p className="text-sm text-fg-secondary">{v.licensePlate || "No plate"}</p>
              </div>
              <Link href={`/vehicles/${v.id}`} className="text-sm text-accent hover:underline">Edit</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
