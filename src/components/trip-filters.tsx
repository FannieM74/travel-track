"use client";

import { useState } from "react";

interface TripFiltersProps {
  filters: {
    vehicleId?: string;
    type?: 'business' | 'private' | undefined;
    startDate?: string;
    endDate?: string;
  };
  vehicles: any[];
  tripsCount: number;
}

export function TripFilters({ filters, vehicles, tripsCount }: TripFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  function buildParams(updates: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(updates)) {
      if (val) params.set(key, val);
    }
    if (!updates.vehicleId && filters.vehicleId) params.set("vehicleId", filters.vehicleId);
    if (!updates.type && filters.type) params.set("type", filters.type);
    if (!updates.dateFrom && filters.startDate) params.set("dateFrom", filters.startDate);
    if (!updates.dateTo && filters.endDate) params.set("dateTo", filters.endDate);
    // Remove keys explicitly set to empty
    for (const [key, val] of Object.entries(updates)) {
      if (!val) params.delete(key);
    }
    return params.toString();
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-accent hover:underline"
      >
        {showFilters ? "Hide filters" : "Filter trips"} ({tripsCount} trips)
      </button>

      {showFilters && (
        <form className="mt-4 bg-panel p-4 rounded-xl border border-line space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-fg">Vehicle</label>
            <select
              value={filters.vehicleId || ""}
              onChange={(e) => {
                window.location.href = `/trips?${buildParams({ vehicleId: e.target.value })}`;
              }}
              className="w-full border border-line rounded px-3 py-2 bg-input text-fg"
            >
              <option value="">All vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.make} {v.model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-fg">Type</label>
            <select
              value={filters.type || ""}
              onChange={(e) => {
                window.location.href = `/trips?${buildParams({ type: e.target.value })}`;
              }}
              className="w-full border border-line rounded px-3 py-2 bg-input text-fg"
            >
              <option value="">All types</option>
              <option value="business">Business</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-fg">Date From</label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => {
                  window.location.href = `/trips?${buildParams({ dateFrom: e.target.value })}`;
                }}
                className="w-full border border-line rounded px-3 py-2 bg-input text-fg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-fg">Date To</label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => {
                  window.location.href = `/trips?${buildParams({ dateTo: e.target.value })}`;
                }}
                className="w-full border border-line rounded px-3 py-2 bg-input text-fg"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.location.href = "/trips"}
              className="flex-1 bg-accent text-on-accent rounded py-2 hover:bg-accent-light transition-colors font-medium"
            >
              Reset Filters
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
