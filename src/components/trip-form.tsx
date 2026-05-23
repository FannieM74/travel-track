"use client";

import { useState, useCallback } from "react";
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

  const handleVehicleChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    if (!vehicleId) return;
    setLoading(true);
    try {
      const last = await getLastOdometer(vehicleId);
      if (last) {
        setStartOdometer(last.value.toString());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRouteChange = useCallback(
    (start: { lat: number; lon: number }, end: { lat: number; lon: number }, distanceKm: number) => {
      setStartLocation(`${start.lat.toFixed(4)}, ${start.lon.toFixed(4)}`);
      setEndLocation(`${end.lat.toFixed(4)}, ${end.lon.toFixed(4)}`);
      if (startOdometer) {
        setEndOdometer((parseInt(startOdometer) + distanceKm).toString());
      }
    },
    [startOdometer],
  );

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

      {!trip && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <label className="block text-sm font-medium mb-2">Pin on Map</label>
          <MapPicker onRouteChange={handleRouteChange} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Location</label>
          <input name="startLocation" required value={startLocation}
            onChange={e => setStartLocation(e.target.value)}
            className="w-full border rounded px-3 py-2" placeholder="Address or place name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Location</label>
          <input name="endLocation" required value={endLocation}
            onChange={e => setEndLocation(e.target.value)}
            className="w-full border rounded px-3 py-2" placeholder="Address or place name" />
        </div>
      </div>
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
