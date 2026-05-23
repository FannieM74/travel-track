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

  function isWard(v: string | undefined) {
    return v ? /ward|municipality/i.test(v) : false;
  }

  const suburb = !isWard(addr.suburb) ? addr.suburb : null;
  const neighbourhood = !isWard(addr.neighbourhood) ? addr.neighbourhood : null;
  const city = addr.city || addr.town || addr.village || "";
  const shortName = neighbourhood || suburb || addr.city_district || city || addr.county || addr.state || `${lat}, ${lon}`;

  return NextResponse.json({
    name: shortName,
    displayName: data.display_name || `${lat}, ${lon}`,
    suburb: suburb || null,
    city: city || null,
  });
}
