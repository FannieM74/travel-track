interface MonthlyChartProps {
  data: { month: string; total: number; business: number }[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const maxKm = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="border border-line rounded-xl shadow-sm p-5 bg-card">
      <h3 className="text-sm font-semibold text-fg mb-4">Monthly Distance (km)</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((d) => {
          const pct = (d.total / maxKm) * 100;
          const bizPct = d.total > 0 ? (d.business / d.total) * 100 : 0;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full rounded-t overflow-hidden" style={{ height: `${Math.max(pct, 3)}%` }}>
                <div className="h-full w-full flex flex-col">
                  <div
                    className="w-full bg-fg-muted/30"
                    style={{ height: `${100 - bizPct}%` }}
                    title={`Private: ${(d.total - d.business).toLocaleString()} km`}
                  />
                  <div
                    className="w-full bg-success"
                    style={{ height: `${bizPct}%` }}
                    title={`Business: ${d.business.toLocaleString()} km`}
                  />
                </div>
              </div>
              <span className="text-[10px] text-fg-muted mt-1">{d.month}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-fg-secondary">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" /> Business</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-fg-muted/30 inline-block" /> Private</span>
      </div>
    </div>
  );
}
