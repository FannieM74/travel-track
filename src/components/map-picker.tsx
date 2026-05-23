"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  onRouteChange: (start: { lat: number; lon: number }, end: { lat: number; lon: number }, distanceKm: number) => void;
}

export function MapPicker({ onRouteChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const routeLayer = useRef<L.Polyline | null>(null);
  const [startPoint, setStartPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([-30.5595, 22.9375], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng: lon } = e.latlng;
      if (!startPoint) {
        setStartPoint({ lat, lon });
        const marker = L.marker([lat, lon]).addTo(map).bindPopup("Start");
        markers.current.push(marker);
      } else if (!endPoint) {
        setEndPoint({ lat, lon });
        const marker = L.marker([lat, lon]).addTo(map).bindPopup("End");
        markers.current.push(marker);
      }
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [startPoint, endPoint]);

  const handleRouteChange = useCallback(onRouteChange, [onRouteChange]);

  useEffect(() => {
    if (startPoint && endPoint) {
      fetch(`/api/osrm/route?startLon=${startPoint.lon}&startLat=${startPoint.lat}&endLon=${endPoint.lon}&endLat=${endPoint.lat}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.code === "Ok" && data.routes?.[0]) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
            if (routeLayer.current) routeLayer.current.remove();
            routeLayer.current = L.polyline(coords, { color: "blue", weight: 3 }).addTo(mapInstance.current!);
            const distanceKm = Math.round(route.distance / 1000);
            handleRouteChange(startPoint, endPoint, distanceKm);
          }
        });
    }
  }, [startPoint, endPoint, handleRouteChange]);

  function resetMap() {
    markers.current.forEach((m) => m.remove());
    markers.current = [];
    if (routeLayer.current) routeLayer.current.remove();
    setStartPoint(null);
    setEndPoint(null);
  }

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="h-80 w-full rounded-lg border" />
      <div className="flex justify-between text-sm text-gray-500">
        <span>{startPoint ? `Start: ${startPoint.lat.toFixed(4)}, ${startPoint.lon.toFixed(4)}` : "Click map to set start"}</span>
        <span>{endPoint ? `End: ${endPoint.lat.toFixed(4)}, ${endPoint.lon.toFixed(4)}` : "Click map to set end"}</span>
        <button type="button" onClick={resetMap} className="text-blue-600 hover:underline">Reset</button>
      </div>
    </div>
  );
}
