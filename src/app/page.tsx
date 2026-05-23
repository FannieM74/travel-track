import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-4 text-fg">TravelTrack</h1>
      <p className="text-xl text-fg-secondary mb-8 max-w-lg">
        SARS-compliant travel logbook for South African employees with travel allowances.
        Log trips, track kilometres, and generate tax-ready reports.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/register"
          className="bg-accent text-on-accent px-6 py-3 rounded-lg hover:bg-accent-light transition-colors font-medium"
        >
          Get Started Free
        </Link>
        <Link
          href="/auth/login"
          className="border border-line px-6 py-3 rounded-lg bg-card text-fg hover:bg-card-hover transition-colors"
        >
          Sign In
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl">
        {[
          { title: "Log Trips", desc: "Record business trips with odometer readings, locations, and purpose." },
          { title: "Track Vehicles", desc: "Manage multiple vehicles with per-tax-year odometer readings." },
          { title: "Export Reports", desc: "Generate SARS-compliant PDF logbooks with deductible estimates." },
        ].map((c) => (
          <div key={c.title} className="p-6 border border-line rounded-xl bg-card shadow-sm">
            <h3 className="font-semibold mb-2 text-fg">{c.title}</h3>
            <p className="text-sm text-fg-secondary">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
