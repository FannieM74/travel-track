import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteTrip } from "@/actions/trips";
import { TripForm } from "@/components/trip-form";

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
      <TripForm vehicles={userVehicles} trip={trip} />

      <form action={deleteTrip.bind(null, id)} className="mt-4">
        <button type="submit" className="w-full border border-red-300 text-red-600 rounded py-2 hover:bg-red-50">
          Delete Trip
        </button>
      </form>
    </div>
  );
}
