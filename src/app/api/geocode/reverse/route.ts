import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat or lon" }, { status: 400 });
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
