import { auth } from "@/lib/auth";
import { db } from "@/db";
import { trips, vehicles, vehicleOdometerReadings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateScaleOfCosts } from "@/lib/sars-calculator";
import { SarsPdfReport } from "@/components/pdf-report";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ taxYear: string; vehicleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { taxYear, vehicleId } = await params;
  const taxYearInt = parseInt(taxYear);
  const userId = session.user.id;

  const [vehicle] = await db.select().from(vehicles).where(
    and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId))
  );
  if (!vehicle) return new Response("Not found", { status: 404 });

  const [odometer] = await db.select().from(vehicleOdometerReadings).where(
    and(eq(vehicleOdometerReadings.vehicleId, vehicleId), eq(vehicleOdometerReadings.taxYear, taxYearInt))
  );

  const vehicleTrips = await db.select().from(trips).where(
    and(eq(trips.vehicleId, vehicleId), eq(trips.taxYear, taxYearInt), eq(trips.isBusiness, true))
  );

  const totalKm = odometer?.closingOdometer && odometer?.openingOdometer
    ? odometer.closingOdometer - odometer.openingOdometer
    : vehicleTrips.reduce((s, t) => s + t.totalKm, 0);

  const businessKm = vehicleTrips.reduce((s, t) => s + t.totalKm, 0);

  const deduction = calculateScaleOfCosts(totalKm, businessKm, 250000);

  const pdf = await renderToBuffer(
    <SarsPdfReport
      userName={session.user.name || "User"}
      taxYear={taxYearInt}
      vehicleName={`${vehicle.make} ${vehicle.model}`}
      licensePlate={vehicle.licensePlate || "—"}
      openingOdometer={odometer?.openingOdometer || null}
      closingOdometer={odometer?.closingOdometer || null}
      totalKm={totalKm}
      businessKm={businessKm}
      businessPercent={Math.round((businessKm / totalKm) * 100 * 10) / 10}
      deductibleAmount={deduction.totalDeduction}
      trips={vehicleTrips.map((t) => ({
        date: t.date,
        startOdometer: t.startOdometer,
        endOdometer: t.endOdometer,
        totalKm: t.totalKm,
        startLocation: t.startLocation,
        endLocation: t.endLocation,
        purpose: t.purpose,
      }))}
    />
  );

  return new Response(new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), {
    headers: {
      "Content-Disposition": `attachment; filename="logbook-${taxYear}-${vehicle.licensePlate || vehicle.id}.pdf"`,
    },
  });
}
