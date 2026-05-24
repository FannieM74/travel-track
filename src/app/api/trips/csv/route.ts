import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userTrips = await db.select().from(trips)
    .where(eq(trips.userId, session.user.id))
    .orderBy(trips.date);

  const headers = ["Date","Vehicle ID","Start Location","End Location","Start Odometer","End Odometer","Total KM","Purpose","Business","Tax Year"];
  const rows = userTrips.map(t => [
    t.date,
    t.vehicleId,
    `"${t.startLocation.replace(/"/g, '""')}"`,
    `"${t.endLocation.replace(/"/g, '""')}"`,
    t.startOdometer,
    t.endOdometer,
    t.totalKm,
    `"${t.purpose.replace(/"/g, '""')}"`,
    t.isBusiness ? "Yes" : "No",
    t.taxYear,
  ]);

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="travel-track-trips-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
