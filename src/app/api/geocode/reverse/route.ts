import { NextResponse } from "next/server";

async function snapToRoad(lat: number, lon: number) {
  try {
    const osrmUrl = `https://router.project-osrm.org/nearest/v1/driving/${lon},${lat}?number=1`;
    const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.code === "Ok" && data.waypoints?.length) {
      const [snappedLon, snappedLat] = data.waypoints[0].location;
      return { lat: snappedLat, lon: snappedLon };
    }
  } catch {}
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

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: { "User-Agent": "TravelTrack/1.0 (travel-track-app)" },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();

    if (!data || data.error) {
      return NextResponse.json({ name: `${lat}, ${lon}`, displayName: `${lat}, ${lon}`, suburb: null, city: null });
    }

    const addr = data.address || {};

    function isWard(v: string | undefined) {
      return v ? /ward|municipality/i.test(v) : true;
    }

    const road = addr.road || "";
    const suburb = isWard(addr.suburb) ? "" : (addr.suburb || "");
    const city = addr.city || addr.town || addr.village || (isWard(addr.city_district) ? "" : (addr.city_district || ""));
    const postcode = addr.postcode || "";

    const parts = [road, suburb, city, postcode].filter(Boolean);
    const displayName = parts.join(", ") || data.display_name || `${lat}, ${lon}`;

    return NextResponse.json({
      name: road || suburb || city || `${lat}, ${lon}`,
      displayName,
      suburb: suburb || null,
      city: city || null,
    });
  } catch {
    return NextResponse.json({ name: `${lat}, ${lon}`, displayName: `${lat}, ${lon}`, suburb: null, city: null });
  }
}
