import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { FlashMessage } from "@/components/flash-message";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userTrips = await db.select().from(trips)
    .where(eq(trips.userId, session.user.id))
    .orderBy(trips.date);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <FlashMessage />
      <h1 className="text-2xl font-bold text-fg">Trips</h1>
        <Link href="/trips/new" className="bg-accent text-on-accent px-4 py-2 rounded-lg hover:bg-accent-light transition-colors font-medium">
          + Log Trip
        </Link>
      </div>
      {userTrips.length === 0 ? (
        <p className="text-fg-secondary">No trips yet. <Link href="/trips/new" className="text-accent">Log your first trip</Link></p>
      ) : (
        <div className="space-y-3">
          {userTrips.map((t) => (
            <Link
              key={t.id}
              href={`/trips/${t.id}`}
              className="block p-4 border border-line rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-card"
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-sm text-fg-secondary">Date: {formatDate(t.date)}</span>
                <span className="text-sm font-semibold text-fg-secondary whitespace-nowrap">{t.totalKm}KM</span>
              </div>
              <p className="text-sm text-fg"><span className="text-fg-secondary">Start:</span> {t.startLocation}</p>
              <p className="text-sm text-fg"><span className="text-fg-secondary">End:</span> {t.endLocation}</p>
              {t.isBusiness && (
                <p className="text-sm text-fg mt-1"><span className="text-fg-secondary">Business:</span> {t.purpose}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
