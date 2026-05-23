import { NextResponse } from "next/server";

async function snapToRoad(lat: number, lon: number) {
  const osrmUrl = `https://router.project-osrm.org/nearest/v1/driving/${lon},${lat}?number=1`;
  const res = await fetch(osrmUrl);
  const data = await res.json();
  if (data.code === "Ok" && data.waypoints?.length) {
    const [snappedLon, snappedLat] = data.waypoints[0].location;
    return { lat: snappedLat, lon: snappedLon };
  }
  return { lat, lon };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  let lat = parseFloat(url.searchParams.get("lat") || "");
  let lon = parseFloat(url.searchParams.get("lon") || "");
  const snap = url.searchParams.get("snap") === "true";

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat or lon" }, { status: 400 });
  }

  if (snap) {
    const snapped = await snapToRoad(lat, lon);
    lat = snapped.lat;
    lon = snapped.lon;
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(nominatimUrl, {
    headers: { "User-Agent": "TravelTrack/1.0 (travel-track-app)" },
  });
  const data = await res.json();

  if (!data || data.error) {
    return NextResponse.json({ name: `${lat}, ${lon}`, displayName: `${lat}, ${lon}`, suburb: null, city: null });
  }

  const addr = data.address || {};
  const suburb = addr.suburb && !/ward|municipality/i.test(addr.suburb) ? addr.suburb : null;
  const city = addr.city || addr.town || addr.village || "";

  return NextResponse.json({
    name: data.name || `${lat}, ${lon}`,
    displayName: data.display_name || `${lat}, ${lon}`,
    suburb: suburb || null,
    city: city || null,
  });
}
