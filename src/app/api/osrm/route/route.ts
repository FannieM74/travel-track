import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const startLon = url.searchParams.get("startLon");
  const startLat = url.searchParams.get("startLat");
  const endLon = url.searchParams.get("endLon");
  const endLat = url.searchParams.get("endLat");

  if (!startLon || !startLat || !endLon || !endLat) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
  const res = await fetch(osrmUrl);
  const data = await res.json();

  return NextResponse.json(data);
}
