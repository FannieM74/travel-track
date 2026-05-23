"use client";

import { useState, useCallback, useRef } from "react";
import { createTrip, updateTrip } from "@/actions/trips";
import { getLastOdometer } from "@/actions/odometer";
import { MapPicker } from "./map-picker";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  licensePlate: string | null;
  year: number;
}

interface TripData {
  id: string;
  date: string;
  vehicleId: string;
  startOdometer: number;
  endOdometer: number;
  startLocation: string;
  endLocation: string;
  purpose: string;
  isBusiness: boolean;
}

export function TripForm({ vehicles, trip }: { vehicles: Vehicle[]; trip?: TripData }) {
  const [startOdometer, setStartOdometer] = useState(trip?.startOdometer.toString() ?? "");
  const [endOdometer, setEndOdometer] = useState(trip?.endOdometer.toString() ?? "");
  const [startLocation, setStartLocation] = useState(trip?.startLocation ?? "");
  const [endLocation, setEndLocation] = useState(trip?.endLocation ?? "");
  const [loading, setLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const startOdoRef = useRef(startOdometer);
  startOdoRef.current = startOdometer;

  const handleVehicleChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    if (!vehicleId) return;
    setLoading(true);
    try {
      const last = await getLastOdometer(vehicleId);
      if (last) {
        setStartOdometer(last.value.toString());
        setEndOdometer("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRouteChange = useCallback(
    (
      start: { lat: number; lon: number },
      end: { lat: number; lon: number },
      distanceKm: number,
      startName: string,
      endName: string,
    ) => {
      setStartLocation(startName);
      setEndLocation(endName);
      const odo = startOdoRef.current;
      if (odo) {
        setEndOdometer((parseInt(odo) + distanceKm).toString());
      }
    },
    [],
  );

  async function handleMyLocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setStartLocation(data.name);
    } catch {
      // denied or failed
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleCalculateDistance() {
    if (!startLocation.trim() || !endLocation.trim()) return;
    setCalcLoading(true);
    try {
      const [startRes, endRes] = await Promise.all([
        fetch(`/api/geocode/search?q=${encodeURIComponent(startLocation)}`),
        fetch(`/api/geocode/search?q=${encodeURIComponent(endLocation)}`),
      ]);
      if (!startRes.ok || !endRes.ok) return;
      const startData = await startRes.json();
      const endData = await endRes.json();

      const osrmRes = await fetch(
        `/api/osrm/route?startLon=${startData.lon}&startLat=${startData.lat}&endLon=${endData.lon}&endLat=${endData.lat}`
      );
      const osrmData = await osrmRes.json();
      if (osrmData.code === "Ok" && osrmData.routes?.[0]) {
        const distanceKm = Math.round(osrmData.routes[0].distance / 1000);
        const odo = startOdoRef.current;
        if (odo) {
          setEndOdometer((parseInt(odo) + distanceKm).toString());
        }
      }
    } finally {
      setCalcLoading(false);
    }
  }

  return (
    <form action={trip ? updateTrip.bind(null, trip.id) : createTrip} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input name="date" type="date" required defaultValue={trip?.date ?? new Date().toISOString().split("T")[0]}
          className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Vehicle</label>
        <select name="vehicleId" required defaultValue={trip?.vehicleId ?? ""}
          onChange={!trip ? handleVehicleChange : undefined}
          className="w-full border rounded px-3 py-2">
          <option value="">Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Odometer (km)</label>
          <input name="startOdometer" type="number" required value={startOdometer}
            onChange={e => setStartOdometer(e.target.value)}
            className="w-full border rounded px-3 py-2" />
          {loading && <span className="text-xs text-gray-500">Loading last reading...</span>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Odometer (km)</label>
          <input name="endOdometer" type="number" required value={endOdometer}
            onChange={e => setEndOdometer(e.target.value)}
            className="w-full border rounded px-3 py-2" />
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <label className="block text-sm font-medium mb-2">Pin on Map</label>
        <MapPicker onRouteChange={handleRouteChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Start Location</label>
            <button
              type="button"
              onClick={handleMyLocation}
              disabled={geoLoading}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {geoLoading ? "..." : "📍 Use my location"}
            </button>
          </div>
          <input name="startLocation" required value={startLocation}
            onChange={e => setStartLocation(e.target.value)}
            className="w-full border rounded px-3 py-2" placeholder="Suburb or address" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Location</label>
          <input name="endLocation" required value={endLocation}
            onChange={e => setEndLocation(e.target.value)}
            className="w-full border rounded px-3 py-2" placeholder="Suburb or address" />
        </div>
      </div>

      {startLocation && endLocation && !trip && (
        <button
          type="button"
          onClick={handleCalculateDistance}
          disabled={calcLoading}
          className="w-full border border-blue-300 text-blue-700 rounded py-2 hover:bg-blue-50 disabled:opacity-50"
        >
          {calcLoading ? "Calculating..." : "Calculate Distance"}
        </button>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Purpose of Trip</label>
        <textarea name="purpose" required defaultValue={trip?.purpose ?? ""}
          className="w-full border rounded px-3 py-2" rows={2} placeholder="e.g. Client meeting in Cape Town" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Trip Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input name="isBusiness" type="radio" value="true" defaultChecked={trip ? trip.isBusiness : true} />
            Business
          </label>
          <label className="flex items-center gap-2">
            <input name="isBusiness" type="radio" value="false" defaultChecked={trip ? !trip.isBusiness : false} />
            Private
          </label>
        </div>
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
        {trip ? "Update Trip" : "Log Trip"}
      </button>
    </form>
  );
}
