"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { trips, vehicleOdometerReadings } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getLastOdometer(vehicleId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const lastTrip = await db
    .select({ endOdometer: trips.endOdometer })
    .from(trips)
    .where(and(eq(trips.vehicleId, vehicleId), eq(trips.userId, session.user.id)))
    .orderBy(desc(trips.date), desc(trips.createdAt))
    .limit(1);

  if (lastTrip.length > 0) {
    return { source: "trip" as const, value: lastTrip[0].endOdometer };
  }

  const lastReading = await db
    .select({ closingOdometer: vehicleOdometerReadings.closingOdometer })
    .from(vehicleOdometerReadings)
    .where(eq(vehicleOdometerReadings.vehicleId, vehicleId))
    .orderBy(desc(vehicleOdometerReadings.taxYear))
    .limit(1);

  if (lastReading.length > 0 && lastReading[0].closingOdometer) {
    return { source: "reading" as const, value: lastReading[0].closingOdometer };
  }

  return null;
}
