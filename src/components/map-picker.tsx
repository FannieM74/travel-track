"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  onRouteChange: (
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    distanceKm: number,
    startName: string,
    endName: string,
  ) => void;
  onDistanceCalculated?: (distanceKm: number) => void;
  endPointFromSearch: { lat: number; lon: number; displayName: string } | null;
  onStartLocated?: (name: string) => void;
}

export function MapPicker({ onRouteChange, onDistanceCalculated, endPointFromSearch, onStartLocated }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const routeLayer = useRef<any>(null);
  const startRef = useRef<{ lat: number; lon: number } | null>(null);
  const endRef = useRef<{ lat: number; lon: number } | null>(null);
  const startNameRef = useRef("");
  const endNameRef = useRef("");
  const routeDistanceRef = useRef(0);
  const prevSearchKeyRef = useRef<string | null>(null);
  const [startPoint, setStartPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);

  async function updateStartAddress(lat: number, lon: number) {
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}&snap=true`);
      const data = await res.json();
      startNameRef.current = data.displayName || `${lat}, ${lon}`;
      onStartLocated?.(data.displayName || `${lat}, ${lon}`);
    } catch {
      startNameRef.current = `${lat}, ${lon}`;
      onStartLocated?.(`${lat}, ${lon}`);
    }
  }

  function createStartMarker(map: any, L: any, lat: number, lon: number, bindPopupText = "Start") {
    const marker = L.marker([lat, lon], { draggable: true }).addTo(map).bindPopup(bindPopupText);
    markers.current.push(marker);

    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      const newLat = pos.lat;
      const newLon = pos.lng;

      startRef.current = { lat: newLat, lon: newLon };
      setStartPoint({ lat: newLat, lon: newLon });

      await updateStartAddress(newLat, newLon);

      if (endRef.current) {
        map.fitBounds(L.latLngBounds([newLat, newLon], [endRef.current.lat, endRef.current.lon]), { padding: [50, 50] });
      }
    });

    return marker;
  }

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
          map.setView([lat, lon], 15);

          createStartMarker(map, L, lat, lon);
          await updateStartAddress(lat, lon);
        } else if (!endRef.current) {
          const marker = L.marker([lat, lon]).addTo(map).bindPopup("End");
          markers.current.push(marker);
          map.fitBounds(L.latLngBounds([startRef.current.lat, startRef.current.lon], [lat, lon]), { padding: [50, 50] });

          try {
            const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
            const data = await res.json();
            endNameRef.current = data.displayName || `${lat}, ${lon}`;
          } catch {
            endNameRef.current = `${lat}, ${lon}`;
          }

          endRef.current = { lat, lon };
          setEndPoint({ lat, lon });
        }
      });

      mapInstance.current = map;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            map.setView([lat, lon], 15);

            startRef.current = { lat, lon };
            setStartPoint({ lat, lon });

            createStartMarker(map, L, lat, lon, "You are here");
            await updateStartAddress(lat, lon);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }
    }

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const point = endPointFromSearch;
    if (!point || !mapInstance.current) return;
    const key = `${point.lat}-${point.lon}`;
    if (key === prevSearchKeyRef.current) return;
    prevSearchKeyRef.current = key;

    async function placeEndMarker() {
      if (!point) return;
      const L = (await import("leaflet")).default;
      const { lat, lon, displayName } = point;

      if (markers.current.length > 1) {
        markers.current[1].remove();
        markers.current = [markers.current[0]];
      }

      const marker = L.marker([lat, lon]).addTo(mapInstance.current).bindPopup("End");
      markers.current.push(marker);
      mapInstance.current.fitBounds(L.latLngBounds([startRef.current!.lat, startRef.current!.lon], [lat, lon]), { padding: [50, 50] });

      endRef.current = { lat, lon };
      endNameRef.current = displayName;
      setEndPoint({ lat, lon });
    }
    placeEndMarker();
  }, [endPointFromSearch]);

  useEffect(() => {
    if (!startPoint || !endPoint) return;

    fetch(
      `/api/osrm/route?startLon=${startPoint.lon}&startLat=${startPoint.lat}&endLon=${endPoint.lon}&endLat=${endPoint.lat}`
    )
      .then((r) => r.json())
      .then(async (data) => {
        if (data.code === "Ok" && data.routes?.[0] && mapInstance.current) {
          const L = (await import("leaflet")).default;
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
          if (routeLayer.current) routeLayer.current.remove();
          routeLayer.current = L.polyline(coords, { color: "blue", weight: 3 }).addTo(mapInstance.current);
          const distKm = Math.round(route.distance / 1000);
          routeDistanceRef.current = distKm;
          setDistanceKm(distKm);
          onDistanceCalculated?.(distKm);
          onRouteChange(
            startRef.current!,
            endRef.current!,
            distKm,
            startNameRef.current,
            endNameRef.current,
          );
        }
      });
  }, [startPoint, endPoint, onDistanceCalculated, onRouteChange]);

  function resetMap() {
    markers.current.forEach((m: any) => m.remove());
    markers.current = [];
    if (routeLayer.current) routeLayer.current.remove();
    startRef.current = null;
    endRef.current = null;
    startNameRef.current = "";
    endNameRef.current = "";
    routeDistanceRef.current = 0;
    prevSearchKeyRef.current = null;
    setStartPoint(null);
    setEndPoint(null);
    setDistanceKm(0);
  }

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="h-80 w-full rounded-lg border" />
      {distanceKm > 0 && (
        <p className="text-sm text-fg-muted text-center py-1">
          Trip distance: <span className="font-semibold text-fg">{distanceKm} km</span>
        </p>
      )}
    </div>
  );
}
