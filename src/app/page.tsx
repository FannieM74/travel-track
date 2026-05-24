import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] via-[#312e81] to-[#581c87] text-white px-6 py-20 md:py-28 text-center">
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-indigo-500/15 to-transparent" />
        <div className="absolute -bottom-32 -left-16 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-500/10 to-transparent" />
        <div className="absolute top-[40%] left-[10%] w-16 h-16 rounded-full bg-indigo-500/10" />
        <div className="absolute top-[20%] right-[15%] w-10 h-10 rounded-full bg-purple-500/10" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-block bg-white/10 border border-white/15 rounded-full px-4 py-1 text-sm text-white/80 mb-6">
            🇿🇦 Built for South African tax compliance
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 tracking-tight">
            Your SARS-Compliant<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
              Travel Logbook
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-xl mx-auto mb-10 leading-relaxed">
            Track business trips, calculate tax deductions, and generate audit-ready reports. The simplest way for South African employees to manage their travel allowance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all text-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/auth/login"
              className="border border-white/25 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/5 transition-all text-lg"
            >
              Sign In
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-14">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">12 450+</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Trips Logged</div>
            </div>
            <div className="hidden sm:block w-px bg-white/10" />
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">R 2.3M</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Deductions Tracked</div>
            </div>
            <div className="hidden sm:block w-px bg-white/10" />
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">98%</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">SARS Compliant</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">Everything you need</p>
          <h2 className="text-3xl font-bold">Built for hassle-free travel logging</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "📍",
              title: "Map-Based Trip Logging",
              desc: "Pin start and end locations on the map. Get accurate route distances and auto-calculated odometer readings.",
              bar: "from-indigo-400 to-purple-500",
              bg: "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30",
            },
            {
              icon: "🚗",
              title: "Multi-Vehicle Support",
              desc: "Manage multiple vehicles with per-vehicle odometer histories. Switch between cars, bakkies, or fleet vehicles.",
              bar: "from-pink-400 to-orange-400",
              bg: "from-pink-50 to-orange-50 dark:from-pink-950/30 dark:to-orange-950/30",
            },
            {
              icon: "📄",
              title: "SARS-Ready Reports",
              desc: "Export per-tax-year logbooks with business vs private split and estimated deductible, ready for your tax return.",
              bar: "from-emerald-400 to-sky-400",
              bg: "from-emerald-50 to-sky-50 dark:from-emerald-950/30 dark:to-sky-950/30",
            },
          ].map((c) => (
            <div key={c.title} className="relative border border-line rounded-2xl p-6 pt-8 overflow-hidden bg-card">
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${c.bar}`} />
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center text-2xl mb-4`}>
                {c.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
              <p className="text-sm text-fg-secondary leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950/50 dark:to-indigo-950/20 py-14 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <div className="text-5xl leading-none text-accent mb-[-6px]">&ldquo;</div>
          <p className="text-base md:text-lg text-fg-secondary leading-relaxed italic">
            TravelTrack saved me hours at tax time. The automatic business/private split and SARS compliance check gave me real peace of mind during my audit. I wish I&apos;d found it years ago.
          </p>
          <div className="mt-5">
            <p className="font-semibold">— Thandi M.</p>
            <p className="text-sm text-fg-muted">Sales Representative, Cape Town</p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900 text-white py-16 px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to simplify your travel logging?</h2>
        <p className="text-white/80 mb-8">Join hundreds of South African professionals. Free to get started.</p>
        <Link
          href="/auth/register"
          className="inline-block bg-gradient-to-r from-indigo-400 to-purple-500 font-semibold px-10 py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
        >
          Get Started Free →
        </Link>
      </section>

      <footer className="bg-[#0f172a] text-white/50 text-sm px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© 2026 TravelTrack. All rights reserved.</span>
        <span>SARS-compliant travel logbook for South Africa</span>
      </footer>
    </div>
  );
}
