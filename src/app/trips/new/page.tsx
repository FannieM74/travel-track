import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TripForm } from "@/components/trip-form";
import Link from "next/link";

export default async function NewTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));
  if (userVehicles.length === 0) redirect("/vehicles/new");

  return (
    <div className="max-w-lg mx-auto p-6">
      <Link href="/trips" className="text-sm text-fg-secondary hover:underline">&larr; Back to trips</Link>
      <h1 className="text-2xl font-bold mt-3 mb-6 text-fg">Log a Trip</h1>
      <TripForm vehicles={userVehicles} />
    </div>
  );
}
