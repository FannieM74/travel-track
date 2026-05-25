"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { computeTaxYear } from "@/lib/tax-year";

export async function createTrip(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const date = formData.get("date") as string;
  const vehicleId = formData.get("vehicleId") as string;
  const startOdometer = parseInt(formData.get("startOdometer") as string);
  const endOdometer = parseInt(formData.get("endOdometer") as string);
  const startLocation = formData.get("startLocation") as string;
  const endLocation = formData.get("endLocation") as string;
  const purpose = (formData.get("purpose") as string) || "Private trip";
  const isBusiness = formData.get("isBusiness") === "true";
  const startOdometerPhoto = formData.get("startOdometerPhoto") as string | null;
  const endOdometerPhoto = formData.get("endOdometerPhoto") as string | null;

  await db.insert(trips).values({
    userId: session.user.id,
    vehicleId,
    date,
    taxYear: computeTaxYear(new Date(date)),
    startOdometer,
    endOdometer,
    totalKm: endOdometer - startOdometer,
    startLocation,
    endLocation,
    purpose,
    isBusiness,
    startOdometerPhoto: startOdometerPhoto || null,
    endOdometerPhoto: endOdometerPhoto || null,
  });

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  redirect("/trips?success=Trip+logged+successfully");
}

export async function updateTrip(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const date = formData.get("date") as string;
  const vehicleId = formData.get("vehicleId") as string;
  const startOdometer = parseInt(formData.get("startOdometer") as string);
  const endOdometer = parseInt(formData.get("endOdometer") as string);
  const startLocation = formData.get("startLocation") as string;
  const endLocation = formData.get("endLocation") as string;
  const purpose = (formData.get("purpose") as string) || "Private trip";
  const isBusiness = formData.get("isBusiness") === "true";
  const startOdometerPhoto = formData.get("startOdometerPhoto") as string | null;
  const endOdometerPhoto = formData.get("endOdometerPhoto") as string | null;

  await db.update(trips).set({
    date,
    vehicleId,
    taxYear: computeTaxYear(new Date(date)),
    startOdometer,
    endOdometer,
    totalKm: endOdometer - startOdometer,
    startLocation,
    endLocation,
    purpose,
    isBusiness,
    startOdometerPhoto: startOdometerPhoto || null,
    endOdometerPhoto: endOdometerPhoto || null,
  }).where(and(eq(trips.id, id), eq(trips.userId, session.user.id)));

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  redirect("/trips?success=Trip+updated+successfully");
}

export async function deleteTrip(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(trips).where(and(eq(trips.id, id), eq(trips.userId, session.user.id)));

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  redirect("/trips?success=Trip+deleted");
}
