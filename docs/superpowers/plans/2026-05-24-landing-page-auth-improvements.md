# Landing Page & Auth Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the basic landing page with a polished Modern SaaS design, update app accent colors to indigo/purple, redirect sign-out to landing, and auto-sign-out after 5 min inactivity.

**Architecture:** Server-rendered landing page (no client JS) with auth check that redirects logged-in users to `/dashboard`. Auto-logout is a client component mounted only on authenticated pages. Sign-out uses next-auth's `signOut()` with callbackUrl.

**Tech Stack:** Next.js 16 App Router, next-auth v5, Tailwind CSS 4 CSS variables

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/page.tsx` | **Rewrite** | Polished landing page + auth redirect |
| `src/app/globals.css` | **Modify** | Update accent color variables |
| `src/components/nav-menu.tsx` | **Modify** | Sign-out link → programmatic signOut() with redirect |
| `src/components/inactivity-logout.tsx` | **Create** | Auto sign-out after 5 min inactivity |
| `src/app/dashboard/layout.tsx` | **Create** | Protected layout mounting InactivityLogout |
| `src/app/trips/layout.tsx` | **Create** | Protected layout mounting InactivityLogout |
| `src/app/vehicles/layout.tsx` | **Create** | Protected layout mounting InactivityLogout |
| `src/app/reports/layout.tsx` | **Create** | Protected layout mounting InactivityLogout |

---

### Task 1: Update accent colors in globals.css

**Files:**
- Modify: `src/app/globals.css:42-46,61-65`

- [ ] **Replace gold accent with indigo/purple in light mode**

```css
  --accent: #6366f1;
  --accent-light: #818cf8;
  --accent-dark: #4f46e5;
  --on-accent: #ffffff;
```

- [ ] **Replace gold accent with indigo/purple in dark mode**

```css
  --accent: #818cf8;
  --accent-light: #a78bfa;
  --accent-dark: #6366f1;
  --on-accent: #ffffff;
```

- [ ] **Verify build compiles**

Run: `npm run build 2>&1 | tail -3`
Expected: No errors, build succeeds.

- [ ] **Commit**

```bash
git add src/app/globals.css
git commit -m "feat: update accent colors to indigo/purple palette"
```

---

### Task 2: Rewrite landing page with auth redirect

**Files:**
- Rewrite: `src/app/page.tsx`

- [ ] **Rewrite `src/app/page.tsx`**

```tsx
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
```

- [ ] **Verify build compiles**

Run: `npm run build 2>&1 | tail -3`
Expected: No errors, build succeeds.

- [ ] **Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace landing page with Modern SaaS design"
```

---

### Task 3: Fix sign-out to redirect to landing page

**Files:**
- Modify: `src/components/nav-menu.tsx`

- [ ] **Read current nav-menu.tsx**

- [ ] **Add `import { signOut } from "next-auth/react"` at top**

```tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
```

- [ ] **Replace the `<a>` sign-out link with a `<button>` using `signOut()`**

Replace lines 53-58:

```tsx
          <button
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="text-sm hover:underline py-2 md:py-0 text-danger text-left"
          >
            Sign out
          </button>
```

- [ ] **Verify build compiles**

Run: `npm run build 2>&1 | tail -3`
Expected: No errors, build succeeds.

- [ ] **Commit**

```bash
git add src/components/nav-menu.tsx
git commit -m "feat: sign-out redirects to landing page"
```

---

### Task 4: Create InactivityLogout component

**Files:**
- Create: `src/components/inactivity-logout.tsx`

- [ ] **Create the component**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

export default function InactivityLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/" });
      }, INACTIVITY_MS);
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
```

- [ ] **Verify build compiles**

Run: `npm run build 2>&1 | tail -3`
Expected: No errors, build succeeds.

- [ ] **Commit**

```bash
git add src/components/inactivity-logout.tsx
git commit -m "feat: add InactivityLogout component"
```

---

### Task 5: Mount InactivityLogout on protected pages via layouts

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/trips/layout.tsx`
- Create: `src/app/vehicles/layout.tsx`
- Create: `src/app/reports/layout.tsx`

- [ ] **Create `src/app/dashboard/layout.tsx`**

```tsx
import InactivityLogout from "@/components/inactivity-logout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InactivityLogout />
      {children}
    </>
  );
}
```

- [ ] **Create `src/app/trips/layout.tsx`**

Same content as dashboard layout, just for trips route group.

- [ ] **Create `src/app/vehicles/layout.tsx`**

Same content as dashboard layout, just for vehicles route group.

- [ ] **Create `src/app/reports/layout.tsx`**

Same content as dashboard layout, just for reports route group.

- [ ] **Verify build compiles**

Run: `npm run build 2>&1 | tail -3`
Expected: No errors, build succeeds.

- [ ] **Commit**

```bash
git add src/app/dashboard/layout.tsx src/app/trips/layout.tsx src/app/vehicles/layout.tsx src/app/reports/layout.tsx
git commit -m "feat: mount InactivityLogout on protected pages"
```

---

### Task 6: Full build and commit

- [ ] **Run full build**

Run: `npm run build 2>&1 | tail -10`
Expected: All routes listed, no errors.

- [ ] **Final commit**

```bash
git add -A
git commit -m "Landing page redesign, sign-out redirect, auto-logout, indigo accent"
git push
```
