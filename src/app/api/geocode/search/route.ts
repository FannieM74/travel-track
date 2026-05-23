import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
  const res = await fetch(nominatimUrl, {
    headers: { "User-Agent": "TravelTrack/1.0 (travel-track-app)" },
  });
  const data = await res.json();

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const result = data[0];
  return NextResponse.json({
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    displayName: result.display_name,
  });
}
