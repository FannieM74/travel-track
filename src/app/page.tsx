import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">TravelTrack</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-lg">
        SARS-compliant travel logbook for South African employees with travel allowances.
        Log trips, track kilometres, and generate tax-ready reports.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/register"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Get Started Free
        </Link>
        <Link
          href="/auth/login"
          className="border px-6 py-3 rounded-lg hover:bg-gray-50"
        >
          Sign In
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl">
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">Log Trips</h3>
          <p className="text-sm text-gray-600">Record business trips with odometer readings, locations, and purpose.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">Track Vehicles</h3>
          <p className="text-sm text-gray-600">Manage multiple vehicles with per-tax-year odometer readings.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">Export Reports</h3>
          <p className="text-sm text-gray-600">Generate SARS-compliant PDF logbooks with deductible estimates.</p>
        </div>
      </div>
    </div>
  );
}
