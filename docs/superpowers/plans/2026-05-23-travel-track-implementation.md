# TravelTrack SARS Logbook — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-user web app for South African employees to log business trips and generate SARS-compliant tax logbook reports.

**Architecture:** Next.js 14+ App Router on Vercel, Neon Postgres via Drizzle ORM, NextAuth.js for auth (email + Google), Leaflet/OSRM for maps.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind, Drizzle ORM, Neon Postgres, NextAuth.js v5, Leaflet, OSRM, @react-pdf/renderer.

---

### Task 1: Project Scaffold & Dependencies

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `drizzle.config.ts`
- Create: `src/styles/globals.css`
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: Create Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install drizzle-orm @neondatabase/serverless next-auth@beta @auth/core @react-pdf/renderer leaflet
npm install -D drizzle-kit @types/leaflet dotenv
```

- [ ] **Step 3: Create `drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 4: Create `.env.local`**

```env
DATABASE_URL="postgres://..."
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
NEXT_PUBLIC_OSRM_BASE_URL="https://router.project-osrm.org"
```

- [ ] **Step 5: Update `.gitignore`**

Append to `.gitignore`:
```
.superpowers/
.env.local
drizzle/
```

- [ ] **Step 6: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Next.js project with dependencies"
```

---

### Task 2: Database Schema (Drizzle)

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`

- [ ] **Step 1: Create `src/db/schema.ts`**

```typescript
import { pgTable, uuid, text, integer, date, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  hashedPassword: text("hashed_password"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vehicleOdometerReadings = pgTable("vehicle_odometer_readings", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id).notNull(),
  taxYear: integer("tax_year").notNull(),
  openingOdometer: integer("opening_odometer"),
  openingDate: date("opening_date"),
  closingOdometer: integer("closing_odometer"),
  closingDate: date("closing_date"),
});

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id).notNull(),
  date: date("date").notNull(),
  taxYear: integer("tax_year").notNull(),
  startOdometer: integer("start_odometer").notNull(),
  endOdometer: integer("end_odometer").notNull(),
  totalKm: integer("total_km").notNull(),
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location").notNull(),
  purpose: text("purpose").notNull(),
  routePolyline: text("route_polyline"),
  isBusiness: boolean("is_business").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Create `src/db/index.ts`**

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 3: Generate and run migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add database schema and drizzle setup"
```

---

### Task 3: Authentication (NextAuth.js)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Create `src/lib/auth.ts`**

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user?.hashedPassword) return null;
        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    Google,
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});
```

Note: Install bcryptjs: `npm install bcryptjs && npm install -D @types/bcryptjs`

- [ ] **Step 2: Create `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create `src/middleware.ts`**

```typescript
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth|$).*)"],
};
```

- [ ] **Step 4: Add User type extension**

Create `src/types/next-auth.d.ts`:

```typescript
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add NextAuth.js with credentials and Google providers"
```

---

### Task 4: Auth Pages (Login / Register)

**Files:**
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/register/page.tsx`
- Create: `src/app/auth/error/page.tsx`
- Create: `src/components/auth/auth-form.tsx`

- [ ] **Step 1: Create `src/components/auth/auth-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-sm mt-20">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {mode === "login" ? "Sign In" : "Create Account"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full border rounded py-2 hover:bg-gray-50"
        >
          Sign in with Google
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-gray-500">
        {mode === "login" ? (
          <>Don&apos;t have an account? <a href="/auth/register" className="text-blue-600">Register</a></>
        ) : (
          <>Already have an account? <a href="/auth/login" className="text-blue-600">Sign in</a></>
        )}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create registration API route**

Create `src/app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email, hashedPassword, name: email.split("@")[0] });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create `src/app/auth/login/page.tsx`** and **`src/app/auth/register/page.tsx`** and **`src/app/auth/error/page.tsx`**

```tsx
// login/page.tsx
import { AuthForm } from "@/components/auth/auth-form";
export default function LoginPage() {
  return <AuthForm mode="login" />;
}
```

```tsx
// register/page.tsx
import { AuthForm } from "@/components/auth/auth-form";
export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
```

```tsx
// error/page.tsx
import Link from "next/link";
export default function AuthErrorPage() {
  return (
    <div className="mx-auto max-w-sm mt-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="mb-4 text-gray-600">Something went wrong. Please try again.</p>
      <Link href="/auth/login" className="text-blue-600">Back to login</Link>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add login, register, and auth error pages"
```

---

### Task 5: Root Layout & Landing Page

**Files:**
- Create: `src/app/layout.tsx` (overwrite default)
- Create: `src/app/page.tsx` (overwrite default)
- Create: `src/components/session-provider.tsx`

- [ ] **Step 1: Create `src/components/session-provider.tsx`**

```tsx
"use client";
import { SessionProvider } from "next-auth/react";
export default SessionProvider;
```

- [ ] **Step 2: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import SessionProvider from "@/components/session-provider";

export const metadata: Metadata = {
  title: "TravelTrack - SARS Travel Logbook",
  description: "Track business trips and generate SARS-compliant travel logbook reports",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <nav className="border-b px-6 py-3 flex items-center justify-between">
            <a href="/" className="font-bold text-lg">TravelTrack</a>
            <div className="flex gap-4 items-center">
              {session?.user ? (
                <>
                  <a href="/dashboard" className="text-sm hover:underline">Dashboard</a>
                  <a href="/trips" className="text-sm hover:underline">Trips</a>
                  <a href="/vehicles" className="text-sm hover:underline">Vehicles</a>
                  <a href="/reports" className="text-sm hover:underline">Reports</a>
                  <span className="text-sm text-gray-500">{session.user.email}</span>
                  <a href="/api/auth/signout" className="text-sm text-red-600 hover:underline">Sign out</a>
                </>
              ) : (
                <a href="/auth/login" className="text-sm hover:underline">Sign In</a>
              )}
            </div>
          </nav>
          <main className="min-h-[calc(100vh-57px)]">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create `src/app/page.tsx` (Landing page)**

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add root layout and landing page"
```

---

### Task 6: Dashboard

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/lib/tax-year.ts`
- Create: `src/components/dashboard-cards.tsx`
- Create: `src/components/recent-trips.tsx`

- [ ] **Step 1: Create `src/lib/tax-year.ts`**

```typescript
export function getCurrentTaxYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 3 ? year : year - 1;
}

export function getTaxYearRange(taxYear: number): { start: Date; end: Date } {
  return {
    start: new Date(taxYear, 2, 1),
    end: new Date(taxYear + 1, 1, 28),
  };
}

export function computeTaxYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 3 ? year : year - 1;
}
```

- [ ] **Step 2: Create `src/components/dashboard-cards.tsx`**

```tsx
interface DashboardCardsProps {
  totalKm: number;
  businessKm: number;
  businessPercent: number;
  tripCount: number;
}

export function DashboardCards({ totalKm, businessKm, businessPercent, tripCount }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Total Kilometres</p>
        <p className="text-2xl font-bold">{totalKm.toLocaleString()}</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Business Kilometres</p>
        <p className="text-2xl font-bold">{businessKm.toLocaleString()}</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Business Use</p>
        <p className="text-2xl font-bold">{businessPercent.toFixed(1)}%</p>
      </div>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Trips Logged</p>
        <p className="text-2xl font-bold">{tripCount}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/recent-trips.tsx`**

```tsx
import Link from "next/link";

interface Trip {
  id: string;
  date: string;
  startLocation: string;
  endLocation: string;
  totalKm: number;
  purpose: string;
  vehicleId: string;
}

export function RecentTrips({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) {
    return <p className="text-gray-500">No trips logged yet. <Link href="/trips/new" className="text-blue-600">Log your first trip</Link></p>;
  }
  return (
    <div className="space-y-2">
      {trips.map((trip) => (
        <Link key={trip.id} href={`/trips/${trip.id}`} className="block p-3 border rounded-lg hover:bg-gray-50">
          <div className="flex justify-between">
            <span className="font-medium">{trip.startLocation} → {trip.endLocation}</span>
            <span className="text-sm text-gray-500">{trip.totalKm} km</span>
          </div>
          <p className="text-sm text-gray-500">{trip.date} — {trip.purpose}</p>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/dashboard/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentTaxYear } from "@/lib/tax-year";
import { DashboardCards } from "@/components/dashboard-cards";
import { RecentTrips } from "@/components/recent-trips";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const taxYear = getCurrentTaxYear();
  const userId = session.user.id;

  const yearTrips = await db.select().from(trips).where(
    and(eq(trips.userId, userId), eq(trips.taxYear, taxYear))
  );

  const totalKm = yearTrips.reduce((sum, t) => sum + t.totalKm, 0);
  const businessKm = yearTrips.filter(t => t.isBusiness).reduce((sum, t) => sum + t.totalKm, 0);
  const businessPercent = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;
  const tripCount = yearTrips.length;
  const recentTrips = yearTrips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const vehicleList = await db.select().from(vehicles).where(eq(vehicles.userId, userId));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/trips/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Log Trip
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-4">Tax Year: {taxYear}/{taxYear + 1}</p>
      <DashboardCards totalKm={totalKm} businessKm={businessKm} businessPercent={businessPercent} tripCount={tripCount} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Trips</h2>
          <RecentTrips trips={recentTrips} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">Vehicles</h2>
          {vehicleList.length === 0 ? (
            <p className="text-gray-500">No vehicles added. <Link href="/vehicles/new" className="text-blue-600">Add a vehicle</Link></p>
          ) : (
            <div className="space-y-2">
              {vehicleList.map((v) => (
                <div key={v.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{v.make} {v.model} ({v.year})</p>
                  <p className="text-sm text-gray-500">{v.licensePlate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add dashboard with summary cards and recent trips"
```

---

### Task 7: Vehicles CRUD

**Files:**
- Create: `src/app/vehicles/page.tsx`
- Create: `src/app/vehicles/new/page.tsx`
- Create: `src/app/vehicles/[id]/page.tsx`
- Create: `src/actions/vehicles.ts`

- [ ] **Step 1: Create `src/actions/vehicles.ts`**

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const make = formData.get("make") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const licensePlate = formData.get("licensePlate") as string;

  await db.insert(vehicles).values({
    userId: session.user.id,
    make,
    model,
    year,
    licensePlate,
  });

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
}

export async function updateVehicle(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const make = formData.get("make") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const licensePlate = formData.get("licensePlate") as string;

  await db.update(vehicles).set({ make, model, year, licensePlate }).where(
    and(eq(vehicles.id, id), eq(vehicles.userId, session.user.id))
  );

  revalidatePath("/vehicles");
}

export async function deleteVehicle(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(vehicles).where(
    and(eq(vehicles.id, id), eq(vehicles.userId, session.user.id))
  );

  revalidatePath("/vehicles");
}
```

- [ ] **Step 2: Create `src/app/vehicles/new/page.tsx`**

```tsx
import { createVehicle } from "@/actions/vehicles";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewVehiclePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add Vehicle</h1>
      <form action={createVehicle} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Make</label>
          <input name="make" required className="w-full border rounded px-3 py-2" placeholder="e.g. Toyota" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input name="model" required className="w-full border rounded px-3 py-2" placeholder="e.g. Corolla" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input name="year" type="number" required className="w-full border rounded px-3 py-2" placeholder="e.g. 2023" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">License Plate</label>
          <input name="licensePlate" className="w-full border rounded px-3 py-2" placeholder="Optional" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
          Add Vehicle
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/vehicles/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function VehiclesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Link href="/vehicles/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Add Vehicle
        </Link>
      </div>
      {userVehicles.length === 0 ? (
        <p className="text-gray-500">No vehicles yet. <Link href="/vehicles/new" className="text-blue-600">Add your first vehicle</Link></p>
      ) : (
        <div className="grid gap-4">
          {userVehicles.map((v) => (
            <div key={v.id} className="p-4 border rounded-lg flex justify-between items-center">
              <div>
                <p className="font-medium">{v.make} {v.model} ({v.year})</p>
                <p className="text-sm text-gray-500">{v.licensePlate || "No plate"}</p>
              </div>
              <Link href={`/vehicles/${v.id}`} className="text-sm text-blue-600 hover:underline">Edit</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/vehicles/[id]/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { vehicles, vehicleOdometerReadings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentTaxYear } from "@/lib/tax-year";
import { updateVehicle, deleteVehicle } from "@/actions/vehicles";
import Link from "next/link";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const { id } = await params;

  const [vehicle] = await db.select().from(vehicles).where(
    and(eq(vehicles.id, id), eq(vehicles.userId, session.user.id))
  );
  if (!vehicle) notFound();

  const taxYear = getCurrentTaxYear();
  const [odometer] = await db.select().from(vehicleOdometerReadings).where(
    and(eq(vehicleOdometerReadings.vehicleId, id), eq(vehicleOdometerReadings.taxYear, taxYear))
  );

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{vehicle.make} {vehicle.model}</h1>
      <p className="text-gray-500 mb-6">{vehicle.licensePlate || "No plate"} · {vehicle.year}</p>

      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="font-semibold mb-3">Tax Year {taxYear}/{taxYear + 1} Odometer</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Opening (1 Mar)</p>
            <p className="text-lg font-bold">{odometer?.openingOdometer?.toLocaleString() || "—"} km</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Closing (28 Feb)</p>
            <p className="text-lg font-bold">{odometer?.closingOdometer?.toLocaleString() || "—"} km</p>
          </div>
        </div>
      </div>

      <form action={updateVehicle.bind(null, id)} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Make</label>
          <input name="make" defaultValue={vehicle.make} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input name="model" defaultValue={vehicle.model} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input name="year" type="number" defaultValue={vehicle.year} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">License Plate</label>
          <input name="licensePlate" defaultValue={vehicle.licensePlate || ""} className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
          Update Vehicle
        </button>
      </form>

      <form action={deleteVehicle.bind(null, id)}>
        <button type="submit" className="w-full border border-red-300 text-red-600 rounded py-2 hover:bg-red-50">
          Delete Vehicle
        </button>
      </form>

      <Link href="/vehicles" className="block mt-4 text-sm text-gray-500 hover:underline">← Back to vehicles</Link>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add vehicle CRUD with odometer readings"
```

---

### Task 8: Trips CRUD

**Files:**
- Create: `src/actions/trips.ts`
- Create: `src/app/trips/page.tsx`
- Create: `src/app/trips/new/page.tsx`
- Create: `src/app/trips/[id]/page.tsx`

- [ ] **Step 1: Create `src/actions/trips.ts`**

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { computeTaxYear } from "@/lib/tax-year";

export async function createTrip(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const date = formData.get("date") as string;
  const vehicleId = formData.get("vehicleId") as string;
  const startOdometer = parseInt(formData.get("startOdometer") as string);
  const endOdometer = parseInt(formData.get("endOdometer") as string);
  const startLocation = formData.get("startLocation") as string;
  const endLocation = formData.get("endLocation") as string;
  const purpose = formData.get("purpose") as string;
  const isBusiness = formData.get("isBusiness") === "true";

  await db.insert(trips).values({
    userId: session.user.id,
    vehicleId,
    date,
    taxYear: computeTaxYear(new Date(date)),
    startOdometer,
    endOdometer,
    totalKm: endOdometer - startOdometer,
    startLocation,
    endLocation,
    purpose,
    isBusiness,
  });

  revalidatePath("/trips");
  revalidatePath("/dashboard");
}

export async function updateTrip(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const date = formData.get("date") as string;
  const vehicleId = formData.get("vehicleId") as string;
  const startOdometer = parseInt(formData.get("startOdometer") as string);
  const endOdometer = parseInt(formData.get("endOdometer") as string);
  const startLocation = formData.get("startLocation") as string;
  const endLocation = formData.get("endLocation") as string;
  const purpose = formData.get("purpose") as string;
  const isBusiness = formData.get("isBusiness") === "true";

  await db.update(trips).set({
    date,
    vehicleId,
    taxYear: computeTaxYear(new Date(date)),
    startOdometer,
    endOdometer,
    totalKm: endOdometer - startOdometer,
    startLocation,
    endLocation,
    purpose,
    isBusiness,
  }).where(and(eq(trips.id, id), eq(trips.userId, session.user.id)));

  revalidatePath("/trips");
  revalidatePath("/dashboard");
}

export async function deleteTrip(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(trips).where(and(eq(trips.id, id), eq(trips.userId, session.user.id)));

  revalidatePath("/trips");
  revalidatePath("/dashboard");
}
```

- [ ] **Step 2: Create `src/app/trips/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userTrips = await db.select().from(trips)
    .where(eq(trips.userId, session.user.id))
    .orderBy(trips.date);
  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));
  const vehicleMap = new Map(userVehicles.map(v => [v.id, `${v.make} ${v.model}`]));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trips</h1>
        <Link href="/trips/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Log Trip
        </Link>
      </div>
      {userTrips.length === 0 ? (
        <p className="text-gray-500">No trips yet. <Link href="/trips/new" className="text-blue-600">Log your first trip</Link></p>
      ) : (
        <div className="space-y-3">
          {userTrips.map((t) => (
            <Link key={t.id} href={`/trips/${t.id}`} className="block p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{t.startLocation} → {t.endLocation}</p>
                  <p className="text-sm text-gray-500">{t.date} · {t.totalKm} km</p>
                  <p className="text-sm text-gray-500">{vehicleMap.get(t.vehicleId) || "Unknown"} · {t.purpose}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${t.isBusiness ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {t.isBusiness ? "Business" : "Private"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/trips/new/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createTrip } from "@/actions/trips";

export default async function NewTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));
  if (userVehicles.length === 0) redirect("/vehicles/new");

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Log a Trip</h1>
      <form action={createTrip} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <select name="vehicleId" required className="w-full border rounded px-3 py-2">
            {userVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Odometer (km)</label>
            <input name="startOdometer" type="number" required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Odometer (km)</label>
            <input name="endOdometer" type="number" required className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Location</label>
          <input name="startLocation" required className="w-full border rounded px-3 py-2" placeholder="Address or place name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Location</label>
          <input name="endLocation" required className="w-full border rounded px-3 py-2" placeholder="Address or place name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Purpose of Trip</label>
          <textarea name="purpose" required className="w-full border rounded px-3 py-2" rows={2} placeholder="e.g. Client meeting in Cape Town" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trip Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="true" defaultChecked />
              Business
            </label>
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="false" />
              Private
            </label>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
          Log Trip
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/trips/[id]/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateTrip, deleteTrip } from "@/actions/trips";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const { id } = await params;

  const [trip] = await db.select().from(trips).where(
    and(eq(trips.id, id), eq(trips.userId, session.user.id))
  );
  if (!trip) notFound();

  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Trip</h1>
      <form action={updateTrip.bind(null, id)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input name="date" type="date" required defaultValue={trip.date}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <select name="vehicleId" required defaultValue={trip.vehicleId} className="w-full border rounded px-3 py-2">
            {userVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.make} {v.model}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Odometer (km)</label>
            <input name="startOdometer" type="number" required defaultValue={trip.startOdometer}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Odometer (km)</label>
            <input name="endOdometer" type="number" required defaultValue={trip.endOdometer}
              className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Location</label>
          <input name="startLocation" required defaultValue={trip.startLocation}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Location</label>
          <input name="endLocation" required defaultValue={trip.endLocation}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Purpose</label>
          <textarea name="purpose" required defaultValue={trip.purpose}
            className="w-full border rounded px-3 py-2" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trip Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="true" defaultChecked={trip.isBusiness} />
              Business
            </label>
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="false" defaultChecked={!trip.isBusiness} />
              Private
            </label>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
          Update Trip
        </button>
      </form>

      <form action={deleteTrip.bind(null, id)} className="mt-4">
        <button type="submit" className="w-full border border-red-300 text-red-600 rounded py-2 hover:bg-red-50">
          Delete Trip
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add trip CRUD with form pages"
```

---

### Task 9: Map Integration (Leaflet + OSRM)

**Files:**
- Create: `src/components/map-picker.tsx`
- Create: `src/components/trip-form-with-map.tsx`
- Create: `src/app/api/osrm/route/route.ts`

- [ ] **Step 1: Create `src/app/api/osrm/route/route.ts`**

```typescript
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const startLon = url.searchParams.get("startLon");
  const startLat = url.searchParams.get("startLat");
  const endLon = url.searchParams.get("endLon");
  const endLat = url.searchParams.get("endLat");

  if (!startLon || !startLat || !endLon || !endLat) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
  const res = await fetch(osrmUrl);
  const data = await res.json();

  return NextResponse.json(data);
}
```

- [ ] **Step 2: Create `src/components/map-picker.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  onRouteChange: (start: { lat: number; lon: number }, end: { lat: number; lon: number }, distanceKm: number) => void;
}

export function MapPicker({ onRouteChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const routeLayer = useRef<L.Polyline | null>(null);
  const [startPoint, setStartPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([-30.5595, 22.9375], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng: lon } = e.latlng;
      if (!startPoint) {
        setStartPoint({ lat, lon });
        const marker = L.marker([lat, lon], {
          icon: L.divIcon({ className: "start-marker", html: "📍", iconSize: [24, 24] }),
        }).addTo(map).bindPopup("Start");
        markers.current.push(marker);
      } else if (!endPoint) {
        setEndPoint({ lat, lon });
        const marker = L.marker([lat, lon], {
          icon: L.divIcon({ className: "end-marker", html: "🏁", iconSize: [24, 24] }),
        }).addTo(map).bindPopup("End");
        markers.current.push(marker);
      }
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [startPoint, endPoint]);

  useEffect(() => {
    if (startPoint && endPoint) {
      fetch(`/api/osrm/route?startLon=${startPoint.lon}&startLat=${startPoint.lat}&endLon=${endPoint.lon}&endLat=${endPoint.lat}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.code === "Ok" && data.routes?.[0]) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
            if (routeLayer.current) routeLayer.current.remove();
            routeLayer.current = L.polyline(coords, { color: "blue", weight: 3 }).addTo(mapInstance.current!);
            const distanceKm = Math.round(route.distance / 1000);
            onRouteChange(startPoint, endPoint, distanceKm);
          }
        });
    }
  }, [startPoint, endPoint, onRouteChange]);

  function resetMap() {
    markers.current.forEach((m) => m.remove());
    markers.current = [];
    if (routeLayer.current) routeLayer.current.remove();
    setStartPoint(null);
    setEndPoint(null);
  }

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="h-80 w-full rounded-lg border" />
      <div className="flex justify-between text-sm text-gray-500">
        <span>{startPoint ? `Start: ${startPoint.lat.toFixed(4)}, ${startPoint.lon.toFixed(4)}` : "Click map to set start"}</span>
        <span>{endPoint ? `End: ${endPoint.lat.toFixed(4)}, ${endPoint.lon.toFixed(4)}` : "Click map to set end"}</span>
        <button type="button" onClick={resetMap} className="text-blue-600 hover:underline">Reset</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `src/app/trips/new/page.tsx` to include map option**

Replace the simple form with a tabbed form (manual / map). Create `src/components/trip-form-with-map.tsx`:

```tsx
"use client";

import { useState } from "react";
import { MapPicker } from "./map-picker";

interface TripFormWithMapProps {
  vehicles: { id: string; make: string; model: string; licensePlate: string | null }[];
}

export function TripFormWithMap({ vehicles }: TripFormWithMapProps) {
  const [mode, setMode] = useState<"manual" | "map">("manual");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [startOdometer, setStartOdometer] = useState("");
  const [endOdometer, setEndOdometer] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  function handleRouteChange(start: { lat: number; lon: number }, end: { lat: number; lon: number }, distance: number) {
    setStartLocation(`${start.lat.toFixed(4)}, ${start.lon.toFixed(4)}`);
    setEndLocation(`${end.lat.toFixed(4)}, ${end.lon.toFixed(4)}`);
    setDistanceKm(distance);
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded ${mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
        >
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setMode("map")}
          className={`px-4 py-2 rounded ${mode === "map" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
        >
          Use Map
        </button>
      </div>

      <form action="/api/trips" method="POST" className="space-y-4">
        <input type="hidden" name="vehicleId" value={vehicles[0]?.id} />
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <select name="vehicleId" required className="w-full border rounded px-3 py-2">
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
            ))}
          </select>
        </div>

        {mode === "map" ? (
          <>
            <MapPicker onRouteChange={handleRouteChange} />
            {distanceKm && (
              <p className="text-sm text-gray-600">Route distance: <strong>{distanceKm} km</strong></p>
            )}
            <input type="hidden" name="startLocation" value={startLocation} />
            <input type="hidden" name="endLocation" value={endLocation} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Odometer (km)</label>
                <input name="startOdometer" type="number" required value={startOdometer}
                  onChange={(e) => setStartOdometer(e.target.value)}
                  className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Odometer (km)</label>
                <input name="endOdometer" type="number" required value={endOdometer}
                  onChange={(e) => setEndOdometer(e.target.value)}
                  className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Location</label>
              <input name="startLocation" required value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                className="w-full border rounded px-3 py-2" placeholder="Address or place name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Location</label>
              <input name="endLocation" required value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
                className="w-full border rounded px-3 py-2" placeholder="Address or place name" />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Purpose of Trip</label>
          <textarea name="purpose" required className="w-full border rounded px-3 py-2" rows={2} placeholder="e.g. Client meeting" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Trip Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="true" defaultChecked />
              Business
            </label>
            <label className="flex items-center gap-2">
              <input name="isBusiness" type="radio" value="false" />
              Private
            </label>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">
          Log Trip
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Replace `src/app/trips/new/page.tsx` to use the map-enabled form**

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TripFormWithMap } from "@/components/trip-form-with-map";

export default async function NewTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, session.user.id));
  if (userVehicles.length === 0) redirect("/vehicles/new");

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Log a Trip</h1>
      <TripFormWithMap vehicles={userVehicles} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Leaflet map picker with OSRM routing"
```

---

### Task 10: Reports & SARS Calculations

**Files:**
- Create: `src/lib/sars-rates.ts`
- Create: `src/lib/sars-calculator.ts`
- Create: `src/app/reports/page.tsx`
- Create: `src/components/pdf-report.tsx`
- Create: `src/app/api/reports/[taxYear]/[vehicleId]/pdf/route.ts`

- [ ] **Step 1: Create `src/lib/sars-rates.ts`**

```typescript
// SARS 2025/2026 scale of costs (simplified — vehicle value brackets)
// Fixed cost per annum, fuel cost per km, maintenance cost per km
// Values based on published SARS rates for 2025/2026 tax year
export interface SarsRateBracket {
  vehicleValue: [number, number];
  fixedCost: number;
  fuelCost: number;
  maintenanceCost: number;
}

export const SARS_RATES_2025: SarsRateBracket[] = [
  { vehicleValue: [0, 100000], fixedCost: 31600, fuelCost: 1.60, maintenanceCost: 0.70 },
  { vehicleValue: [100001, 200000], fixedCost: 54600, fuelCost: 1.70, maintenanceCost: 0.80 },
  { vehicleValue: [200001, 300000], fixedCost: 78600, fuelCost: 1.80, maintenanceCost: 0.90 },
  { vehicleValue: [300001, 400000], fixedCost: 103000, fuelCost: 1.85, maintenanceCost: 1.05 },
  { vehicleValue: [400001, 500000], fixedCost: 129600, fuelCost: 1.90, maintenanceCost: 1.15 },
  { vehicleValue: [500001, Infinity], fixedCost: 129600, fuelCost: 1.95, maintenanceCost: 1.20 },
];

export function getRateBracket(vehicleValue: number): SarsRateBracket {
  return SARS_RATES_2025.find(
    (b) => vehicleValue >= b.vehicleValue[0] && vehicleValue <= b.vehicleValue[1]
  )!;
}
```

- [ ] **Step 2: Create `src/lib/sars-calculator.ts`**

```typescript
import { getRateBracket } from "./sars-rates";

export interface SarsDeductionResult {
  totalKm: number;
  businessKm: number;
  businessPercent: number;
  fixedCostDeduction: number;
  fuelDeduction: number;
  maintenanceDeduction: number;
  totalDeduction: number;
}

export function calculateScaleOfCosts(
  totalKm: number,
  businessKm: number,
  vehicleValue: number,
): SarsDeductionResult {
  const bracket = getRateBracket(vehicleValue);
  const businessPercent = totalKm > 0 ? businessKm / totalKm : 0;

  const fixedCostDeduction = Math.round(bracket.fixedCost * businessPercent);
  const fuelDeduction = Math.round(businessKm * bracket.fuelCost);
  const maintenanceDeduction = Math.round(businessKm * bracket.maintenanceCost);
  const totalDeduction = fixedCostDeduction + fuelDeduction + maintenanceDeduction;

  return {
    totalKm,
    businessKm,
    businessPercent: Math.round(businessPercent * 100 * 10) / 10,
    fixedCostDeduction,
    fuelDeduction,
    maintenanceDeduction,
    totalDeduction,
  };
}
```

- [ ] **Step 3: Create `src/app/reports/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trips, vehicles, vehicleOdometerReadings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentTaxYear, getTaxYearRange } from "@/lib/tax-year";
import { calculateScaleOfCosts } from "@/lib/sars-calculator";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const taxYear = getCurrentTaxYear();
  const userId = session.user.id;
  const userVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, userId));

  const reportData = await Promise.all(
    userVehicles.map(async (v) => {
      const vehicleTrips = await db.select().from(trips).where(
        and(eq(trips.vehicleId, v.id), eq(trips.taxYear, taxYear))
      );
      const [odometer] = await db.select().from(vehicleOdometerReadings).where(
        and(eq(vehicleOdometerReadings.vehicleId, v.id), eq(vehicleOdometerReadings.taxYear, taxYear))
      );

      const totalKm = odometer?.closingOdometer && odometer?.openingOdometer
        ? odometer.closingOdometer - odometer.openingOdometer
        : vehicleTrips.reduce((s, t) => s + t.totalKm, 0);

      const businessKm = vehicleTrips
        .filter((t) => t.isBusiness)
        .reduce((s, t) => s + t.totalKm, 0);

      const deduction = calculateScaleOfCosts(totalKm, businessKm, 250000);
      const tripCount = vehicleTrips.length;

      return { vehicle: v, odometer, totalKm, businessKm, tripCount, deduction };
    })
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">SARS Reports</h1>
      <p className="text-gray-500 mb-6">Tax Year: {taxYear}/{taxYear + 1}</p>

      {reportData.length === 0 ? (
        <p className="text-gray-500">Add vehicles and log trips to generate reports.</p>
      ) : (
        <div className="space-y-6">
          {reportData.map((r) => (
            <div key={r.vehicle.id} className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-1">
                {r.vehicle.make} {r.vehicle.model} ({r.vehicle.year})
              </h2>
              <p className="text-sm text-gray-500 mb-4">{r.vehicle.licensePlate}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Opening (1 Mar)</p>
                  <p className="font-bold">{r.odometer?.openingOdometer?.toLocaleString() || "—"} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Closing (28 Feb)</p>
                  <p className="font-bold">{r.odometer?.closingOdometer?.toLocaleString() || "—"} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Kilometres</p>
                  <p className="font-bold">{r.totalKm.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Kilometres</p>
                  <p className="font-bold">{r.businessKm.toLocaleString()} km</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Scale of Costs — Estimated Deduction</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Fixed Cost</p>
                    <p className="font-bold">R {r.deduction.fixedCostDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fuel</p>
                    <p className="font-bold">R {r.deduction.fuelDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Maintenance</p>
                    <p className="font-bold">R {r.deduction.maintenanceDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-lg">R {r.deduction.totalDeduction.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <a
                  href={`/api/reports/${taxYear}/${r.vehicle.id}/pdf`}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Download PDF Logbook
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/pdf-report.tsx`**

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  section: { marginBottom: 16 },
  heading: { fontSize: 14, fontWeight: "bold", marginBottom: 8, borderBottomWidth: 1, paddingBottom: 4 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 120, fontWeight: "bold" },
  value: { flex: 1 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f0f0f0", padding: 4, fontWeight: "bold" },
  tableRow: { flexDirection: "row", padding: 4, borderBottomWidth: 0.5 },
  colDate: { width: "12%" },
  colOdometer: { width: "15%" },
  colKm: { width: "8%" },
  colFrom: { width: "20%" },
  colTo: { width: "20%" },
  colPurpose: { flex: 1 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "gray", textAlign: "center" },
});

interface PdfReportProps {
  userName: string;
  taxYear: number;
  vehicleName: string;
  licensePlate: string;
  openingOdometer: number | null;
  closingOdometer: number | null;
  totalKm: number;
  businessKm: number;
  businessPercent: number;
  deductibleAmount: number;
  trips: Array<{
    date: string;
    startOdometer: number;
    endOdometer: number;
    totalKm: number;
    startLocation: string;
    endLocation: string;
    purpose: string;
  }>;
}

export function SarsPdfReport({
  userName, taxYear, vehicleName, licensePlate, openingOdometer, closingOdometer,
  totalKm, businessKm, businessPercent, deductibleAmount, trips,
}: PdfReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>SARS Travel Logbook</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Taxpayer Details</Text>
          <View style={styles.row}><Text style={styles.label}>Name:</Text><Text style={styles.value}>{userName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Tax Year:</Text><Text style={styles.value}>{taxYear}/{taxYear + 1}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Vehicle Details</Text>
          <View style={styles.row}><Text style={styles.label}>Vehicle:</Text><Text style={styles.value}>{vehicleName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>License Plate:</Text><Text style={styles.value}>{licensePlate}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Opening (1 Mar):</Text><Text style={styles.value}>{openingOdometer?.toLocaleString() || "—"} km</Text></View>
          <View style={styles.row}><Text style={styles.label}>Closing (28 Feb):</Text><Text style={styles.value}>{closingOdometer?.toLocaleString() || "—"} km</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total Kilometres:</Text><Text style={styles.value}>{totalKm.toLocaleString()} km</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Business Kilometres:</Text><Text style={styles.value}>{businessKm.toLocaleString()} km</Text></View>
          <View style={styles.row}><Text style={styles.label}>Business Use:</Text><Text style={styles.value}>{businessPercent}%</Text></View>
          <View style={styles.row}><Text style={styles.label}>Estimated Deduction:</Text><Text style={styles.value}>R {deductibleAmount.toLocaleString()}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Business Trips</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDate}>Date</Text>
              <Text style={styles.colOdometer}>Start/End</Text>
              <Text style={styles.colKm}>Km</Text>
              <Text style={styles.colFrom}>From</Text>
              <Text style={styles.colTo}>To</Text>
              <Text style={styles.colPurpose}>Purpose</Text>
            </View>
            {trips.map((t, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDate}>{t.date}</Text>
                <Text style={styles.colOdometer}>{t.startOdometer}-{t.endOdometer}</Text>
                <Text style={styles.colKm}>{t.totalKm}</Text>
                <Text style={styles.colFrom}>{t.startLocation}</Text>
                <Text style={styles.colTo}>{t.endLocation}</Text>
                <Text style={styles.colPurpose}>{t.purpose}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          This logbook was generated by TravelTrack. You must retain this record for at least 5 years from the date of submission of your tax return as it may be required for verification by SARS.
        </Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 5: Create `src/app/api/reports/[taxYear]/[vehicleId]/pdf/route.ts`**

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { trips, vehicles, vehicleOdometerReadings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateScaleOfCosts } from "@/lib/sars-calculator";
import { SarsPdfReport } from "@/components/pdf-report";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ taxYear: string; vehicleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { taxYear, vehicleId } = await params;
  const taxYearInt = parseInt(taxYear);
  const userId = session.user.id;

  const [vehicle] = await db.select().from(vehicles).where(
    and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId))
  );
  if (!vehicle) return new Response("Not found", { status: 404 });

  const [odometer] = await db.select().from(vehicleOdometerReadings).where(
    and(eq(vehicleOdometerReadings.vehicleId, vehicleId), eq(vehicleOdometerReadings.taxYear, taxYearInt))
  );

  const vehicleTrips = await db.select().from(trips).where(
    and(eq(trips.vehicleId, vehicleId), eq(trips.taxYear, taxYearInt), eq(trips.isBusiness, true))
  );

  const totalKm = odometer?.closingOdometer && odometer?.openingOdometer
    ? odometer.closingOdometer - odometer.openingOdometer
    : vehicleTrips.reduce((s, t) => s + t.totalKm, 0);

  const businessKm = vehicleTrips.reduce((s, t) => s + t.totalKm, 0);

  const deduction = calculateScaleOfCosts(totalKm, businessKm, 250000);

  const pdf = await renderToBuffer(
    <SarsPdfReport
      userName={session.user.name || "User"}
      taxYear={taxYearInt}
      vehicleName={`${vehicle.make} ${vehicle.model}`}
      licensePlate={vehicle.licensePlate || "—"}
      openingOdometer={odometer?.openingOdometer || null}
      closingOdometer={odometer?.closingOdometer || null}
      totalKm={totalKm}
      businessKm={businessKm}
      businessPercent={Math.round((businessKm / totalKm) * 100 * 10) / 10}
      deductibleAmount={deduction.totalDeduction}
      trips={vehicleTrips.map((t) => ({
        date: t.date,
        startOdometer: t.startOdometer,
        endOdometer: t.endOdometer,
        totalKm: t.totalKm,
        startLocation: t.startLocation,
        endLocation: t.endLocation,
        purpose: t.purpose,
      }))}
    />
  );

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="logbook-${taxYear}-${vehicle.licensePlate || vehicle.id}.pdf"`,
    },
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add reports page, SARS calculator, and PDF export"
```

---

### Task 11: Odometer Readings Management

**Files:**
- Modify: `src/actions/vehicles.ts` (add odometer actions)
- Modify: `src/app/vehicles/[id]/page.tsx` (add odometer form)

- [ ] **Step 1: Add odometer actions to `src/actions/vehicles.ts`**

Append to `src/actions/vehicles.ts`:

```typescript
export async function setOpeningOdometer(vehicleId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const taxYear = parseInt(formData.get("taxYear") as string);
  const openingOdometer = parseInt(formData.get("openingOdometer") as string);
  const openingDate = formData.get("openingDate") as string;

  const [existing] = await db.select().from(vehicleOdometerReadings).where(
    and(eq(vehicleOdometerReadings.vehicleId, vehicleId), eq(vehicleOdometerReadings.taxYear, taxYear))
  );

  if (existing) {
    await db.update(vehicleOdometerReadings).set({ openingOdometer, openingDate }).where(eq(vehicleOdometerReadings.id, existing.id));
  } else {
    await db.insert(vehicleOdometerReadings).values({ vehicleId, taxYear, openingOdometer, openingDate });
  }

  revalidatePath("/vehicles");
}

export async function setClosingOdometer(vehicleId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const taxYear = parseInt(formData.get("taxYear") as string);
  const closingOdometer = parseInt(formData.get("closingOdometer") as string);
  const closingDate = formData.get("closingDate") as string;

  const [existing] = await db.select().from(vehicleOdometerReadings).where(
    and(eq(vehicleOdometerReadings.vehicleId, vehicleId), eq(vehicleOdometerReadings.taxYear, taxYear))
  );

  if (existing) {
    await db.update(vehicleOdometerReadings).set({ closingOdometer, closingDate }).where(eq(vehicleOdometerReadings.id, existing.id));
  } else {
    await db.insert(vehicleOdometerReadings).values({ vehicleId, taxYear, closingOdometer, closingDate });
  }

  revalidatePath("/vehicles");
}
```

- [ ] **Step 2: Update `src/app/vehicles/[id]/page.tsx` to include odometer forms**

After the vehicle details section, add:

```tsx
<form action={setOpeningOdometer.bind(null, id)} className="border rounded-lg p-4 mb-4">
  <h3 className="font-semibold mb-3">Set Opening Odometer (1 March)</h3>
  <input type="hidden" name="taxYear" value={taxYear} />
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm mb-1">Odometer Reading (km)</label>
      <input name="openingOdometer" type="number" required defaultValue={odometer?.openingOdometer || ""}
        className="w-full border rounded px-3 py-2" />
    </div>
    <div>
      <label className="block text-sm mb-1">Date</label>
      <input name="openingDate" type="date" required defaultValue={odometer?.openingDate || `${taxYear}-03-01`}
        className="w-full border rounded px-3 py-2" />
    </div>
  </div>
  <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
    Save Opening Reading
  </button>
</form>

<form action={setClosingOdometer.bind(null, id)} className="border rounded-lg p-4 mb-4">
  <h3 className="font-semibold mb-3">Set Closing Odometer (28 February)</h3>
  <input type="hidden" name="taxYear" value={taxYear} />
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm mb-1">Odometer Reading (km)</label>
      <input name="closingOdometer" type="number" required defaultValue={odometer?.closingOdometer || ""}
        className="w-full border rounded px-3 py-2" />
    </div>
    <div>
      <label className="block text-sm mb-1">Date</label>
      <input name="closingDate" type="date" required defaultValue={odometer?.closingDate || `${taxYear + 1}-02-28`}
        className="w-full border rounded px-3 py-2" />
    </div>
  </div>
  <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
    Save Closing Reading
  </button>
</form>
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add odometer reading management"
```

---

### Task 12: Final Polish & Verification

**Files:**
- Modify: `src/app/layout.tsx`
- Ensure everything builds

- [ ] **Step 1: TypeScript build check**

```bash
npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 2: Next.js build check**

```bash
npm run build
```

- [ ] **Step 3: Create `.env.example`**

```env
DATABASE_URL="postgres://user:pass@ep-example.us-east-2.aws.neon.tech/neondb"
AUTH_SECRET="your-secret-here"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
NEXT_PUBLIC_OSRM_BASE_URL="https://router.project-osrm.org"
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: final cleanup, env example, build verification"
```
