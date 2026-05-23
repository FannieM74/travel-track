import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat or lon" }, { status: 400 });
  }

  const osrmUrl = `https://router.project-osrm.org/nearest/v1/driving/${lon},${lat}?number=1`;
  const res = await fetch(osrmUrl);
  const data = await res.json();

  if (data.code !== "Ok" || !data.waypoints?.length) {
    return NextResponse.json({ snapped: false, lat: parseFloat(lat), lon: parseFloat(lon) });
  }

  const [snappedLon, snappedLat] = data.waypoints[0].location;
  return NextResponse.json({ snapped: true, lat: snappedLat, lon: snappedLon });
}
