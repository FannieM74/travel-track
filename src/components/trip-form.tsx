"use client";

import { useState, useCallback, useRef } from "react";
import { createTrip, updateTrip } from "@/actions/trips";
import { getLastOdometer } from "@/actions/odometer";
import { MapPicker } from "./map-picker";
import { AddressSearch } from "./address-search";

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
  const [endPointFromSearch, setEndPointFromSearch] = useState<{ lat: number; lon: number; displayName: string } | null>(null);
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

  return (
    <form action={trip ? updateTrip.bind(null, trip.id) : createTrip} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-fg">Date</label>
        <input name="date" type="date" required defaultValue={trip?.date ?? new Date().toISOString().split("T")[0]}
          className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-fg">Vehicle</label>
        <select name="vehicleId" required defaultValue={trip?.vehicleId ?? ""}
          onChange={!trip ? handleVehicleChange : undefined}
          className="w-full border border-line rounded px-3 py-2 bg-input text-fg">
          <option value="">Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">Start Odometer (km)</label>
          <input name="startOdometer" type="number" required value={startOdometer}
            onChange={e => setStartOdometer(e.target.value)}
            className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
          {loading && <span className="text-xs text-fg-muted">Loading last reading...</span>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-fg">End Odometer (km)</label>
          <input name="endOdometer" type="number" required value={endOdometer}
            onChange={e => setEndOdometer(e.target.value)}
            className="w-full border border-line rounded px-3 py-2 bg-input text-fg" />
        </div>
      </div>

      <div className="border border-line rounded-xl shadow-sm p-4 bg-panel">
        <label className="block text-sm font-medium mb-2 text-fg">Pin on Map</label>
        <MapPicker onRouteChange={handleRouteChange} endPointFromSearch={endPointFromSearch} onStartLocated={setStartLocation} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 text-fg">Start Location</label>
        <input name="startLocation" required value={startLocation}
          onChange={e => setStartLocation(e.target.value)}
          className="w-full border border-line rounded px-3 py-2 bg-input text-fg" placeholder="Start address" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-fg">End Location</label>
        <AddressSearch
          value={endLocation}
          onChange={setEndLocation}
          onSelect={(result) => {
            setEndPointFromSearch({ lat: result.lat, lon: result.lon, displayName: result.displayName });
          }}
          placeholder="Search street address..."
        />
        <input name="endLocation" type="hidden" value={endLocation} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-fg">Purpose of Trip</label>
        <textarea name="purpose" required defaultValue={trip?.purpose ?? ""}
          className="w-full border border-line rounded px-3 py-2 bg-input text-fg" rows={2} placeholder="e.g. Client meeting in Cape Town" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-fg">Trip Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-fg">
            <input name="isBusiness" type="radio" value="true" defaultChecked={trip ? trip.isBusiness : true} />
            Business
          </label>
          <label className="flex items-center gap-2 text-fg">
            <input name="isBusiness" type="radio" value="false" defaultChecked={trip ? !trip.isBusiness : false} />
            Private
          </label>
        </div>
      </div>
      <button type="submit" className="w-full bg-accent text-on-accent rounded py-2 hover:bg-accent-light transition-colors font-medium">
        {trip ? "Update Trip" : "Log Trip"}
      </button>
    </form>
  );
}
