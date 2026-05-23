"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehicles, vehicleOdometerReadings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const make = formData.get("make") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const licensePlate = formData.get("licensePlate") as string;

  await db.insert(vehicles).values({
    userId: session.user.id,
    make,
    model,
    year,
    licensePlate,
  });

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  redirect("/vehicles?success=Vehicle+added+successfully");
}

export async function updateVehicle(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const make = formData.get("make") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const licensePlate = formData.get("licensePlate") as string;

  await db.update(vehicles).set({ make, model, year, licensePlate }).where(
    and(eq(vehicles.id, id), eq(vehicles.userId, session.user.id))
  );

  revalidatePath("/vehicles");
  redirect("/vehicles?success=Vehicle+updated+successfully");
}

export async function deleteVehicle(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(vehicles).where(
    and(eq(vehicles.id, id), eq(vehicles.userId, session.user.id))
  );

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  redirect("/vehicles?success=Vehicle+deleted");
}

export async function setOpeningOdometer(vehicleId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const taxYear = parseInt(formData.get("taxYear") as string);
  const openingOdometer = parseInt(formData.get("openingOdometer") as string);
  const openingDate = formData.get("openingDate") as string;

  const [existing] = await db.select().from(vehicleOdometerReadings).where(
    and(eq(vehicleOdometerReadings.vehicleId, vehicleId), eq(vehicleOdometerReadings.taxYear, taxYear))
  );

  if (existing) {
    await db.update(vehicleOdometerReadings).set({ openingOdometer, openingDate }).where(eq(vehicleOdometerReadings.id, existing.id));
  } else {
    await db.insert(vehicleOdometerReadings).values({ vehicleId, taxYear, openingOdometer, openingDate });
  }

  revalidatePath("/vehicles");
  redirect(`/vehicles/${vehicleId}?success=Opening+odometer+saved`);
}

export async function setClosingOdometer(vehicleId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const taxYear = parseInt(formData.get("taxYear") as string);
  const closingOdometer = parseInt(formData.get("closingOdometer") as string);
  const closingDate = formData.get("closingDate") as string;

  const [existing] = await db.select().from(vehicleOdometerReadings).where(
    and(eq(vehicleOdometerReadings.vehicleId, vehicleId), eq(vehicleOdometerReadings.taxYear, taxYear))
  );

  if (existing) {
    await db.update(vehicleOdometerReadings).set({ closingOdometer, closingDate }).where(eq(vehicleOdometerReadings.id, existing.id));
  } else {
    await db.insert(vehicleOdometerReadings).values({ vehicleId, taxYear, closingOdometer, closingDate });
  }

  revalidatePath("/vehicles");
  redirect(`/vehicles/${vehicleId}?success=Closing+odometer+saved`);
}
