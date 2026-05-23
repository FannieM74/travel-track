"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MapPickerProps {
  onRouteChange: (
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    distanceKm: number,
    startName: string,
    endName: string,
  ) => void;
}

export function MapPicker({ onRouteChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const routeLayer = useRef<any>(null);
  const startRef = useRef<{ lat: number; lon: number } | null>(null);
  const endRef = useRef<{ lat: number; lon: number } | null>(null);
  const startNameRef = useRef("");
  const endNameRef = useRef("");
  const [startPoint, setStartPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [startName, setStartName] = useState("");
  const [endName, setEndName] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([-30.5595, 22.9375], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      map.on("click", async (e: any) => {
        const { lat, lng: lon } = e.latlng;
        if (!startRef.current) {
          startRef.current = { lat, lon };
          setStartPoint({ lat, lon });
          const marker = L.marker([lat, lon]).addTo(map).bindPopup("Start");
          markers.current.push(marker);
          map.setView([lat, lon], 15);

          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          startNameRef.current = data.name;
          setStartName(data.name);
        } else if (!endRef.current) {
          endRef.current = { lat, lon };
          setEndPoint({ lat, lon });
          const marker = L.marker([lat, lon]).addTo(map).bindPopup("End");
          markers.current.push(marker);
          map.setView([lat, lon], 15);

          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          endNameRef.current = data.name;
          setEndName(data.name);
        }
      });

      mapInstance.current = map;
    }

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const handleRouteChange = useCallback(onRouteChange, [onRouteChange]);

  useEffect(() => {
    if (startPoint && endPoint) {
      fetch(`/api/osrm/route?startLon=${startPoint.lon}&startLat=${startPoint.lat}&endLon=${endPoint.lon}&endLat=${endPoint.lat}`)
        .then((r) => r.json())
        .then(async (data) => {
          if (data.code === "Ok" && data.routes?.[0] && mapInstance.current) {
            const L = (await import("leaflet")).default;
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
            if (routeLayer.current) routeLayer.current.remove();
            routeLayer.current = L.polyline(coords, { color: "blue", weight: 3 }).addTo(mapInstance.current);
            const distanceKm = Math.round(route.distance / 1000);
            handleRouteChange(startPoint, endPoint, distanceKm, startNameRef.current, endNameRef.current);
          }
        });
    }
  }, [startPoint, endPoint, handleRouteChange]);

  async function useMyLocation() {
    if (!navigator.geolocation || !mapInstance.current) return;
    setGeoLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      const L = (await import("leaflet")).default;
      const map = mapInstance.current;

      map.setView([lat, lon], 15);

      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      const name = data.name;

      startRef.current = { lat, lon };
      startNameRef.current = name;
      setStartPoint({ lat, lon });
      setStartName(name);

      const marker = L.marker([lat, lon]).addTo(map).bindPopup(`Start: ${name}`);
      markers.current.push(marker);
    } catch {
      // geolocation denied or failed
    } finally {
      setGeoLoading(false);
    }
  }

  function resetMap() {
    markers.current.forEach((m: any) => m.remove());
    markers.current = [];
    if (routeLayer.current) routeLayer.current.remove();
    startRef.current = null;
    endRef.current = null;
    startNameRef.current = "";
    endNameRef.current = "";
    setStartPoint(null);
    setEndPoint(null);
    setStartName("");
    setEndName("");
  }

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="h-80 w-full rounded-lg border" />
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex gap-4">
          <span>{startName || (startPoint ? "Looking up address..." : "Click map to set start")}</span>
          <span>{endName || (endPoint ? "Looking up address..." : "Click map to set end")}</span>
        </div>
        <div className="flex gap-2">
          {isMobile && (
            <button
              type="button"
              onClick={useMyLocation}
              disabled={geoLoading}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              {geoLoading ? "Locating..." : "📍 My Location"}
            </button>
          )}
          <button type="button" onClick={resetMap} className="text-blue-600 hover:underline">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
