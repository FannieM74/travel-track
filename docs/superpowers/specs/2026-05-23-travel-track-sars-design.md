# TravelTrack — SARS Travel Logbook App

## Overview

A multi-user web application for South African employees who receive a travel allowance. Users log business trips throughout the tax year and generate SARS-compliant logbook reports at tax time, with auto-calculated deductible estimates.

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 14+ App Router | Server components, API routes, Vercel-native |
| **Database** | Neon (serverless Postgres) | Free tier, concurrent users, edge-ready |
| **ORM** | Drizzle ORM | Lightweight, no client generator, faster cold starts |
| **Auth** | NextAuth.js (Auth.js) v5 | Email/password + Google OAuth, built for Next.js |
| **Maps** | Leaflet + OpenStreetMap tiles | Free, no API key |
| **Routing** | OSRM (public API) | Free distance & route polyline |
| **PDF** | @react-pdf/renderer | SARS-compliant PDF export on serverless |
| **Deploy** | Vercel | Serverless functions, edge caching |

## Data Model

### users
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| email | text unique | |
| hashedPassword | text | null for OAuth-only users |
| image | text | avatar URL |
| createdAt | timestamp | |

### vehicles
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| userId | uuid FK→users | RLS/tenant isolation |
| make | text | e.g. Toyota |
| model | text | e.g. Corolla |
| year | int | |
| licensePlate | text | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### vehicle_odometer_readings
Stores the opening (1 Mar) and closing (28 Feb) readings per tax year per vehicle.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vehicleId | uuid FK→vehicles | |
| taxYear | int | e.g. 2025 (for year 2025/2026) |
| openingOdometer | int | reading on 1 March |
| openingDate | date | 1 March of tax year |
| closingOdometer | int | reading on 28/29 February |
| closingDate | date | last day of Feb |

One row per vehicle per tax year. Users must set opening before logging trips in a new tax year.

### trips
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| userId | uuid FK→users | |
| vehicleId | uuid FK→vehicles | |
| date | date | |
| taxYear | int | auto-computed from date |
| startOdometer | int | odometer at trip start |
| endOdometer | int | odometer at trip end |
| totalKm | int | endOdometer - startOdometer |
| startLocation | text | address or place name |
| endLocation | text | address or place name |
| purpose | text | reason for business trip |
| routePolyline | text | optional OSRM encoded polyline |
| isBusiness | boolean | true = business, false = private |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**SARS minimum fields satisfied:** date, kilometres, start/end location, purpose — all required fields are present.

### Tax Year Determination
- SA tax year runs 1 March to 28/29 February
- `taxYear` in trips = year of the March start (e.g., 1 Mar 2025 → taxYear = 2025 for 2025/2026)
- Computed via a simple function on insert

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Vercel                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Next.js App Router                     │  │
│  │                                                     │  │
│  │  Server Components (pages)                          │  │
│  │  Server Actions (mutations)                         │  │
│  │  API Routes (external)                              │  │
│  │  Route Handlers (PDF download)                      │  │
│  └──────────┬──────────────────────┬───────────────────┘  │
│             │ NextAuth.js          │ Drizzle ORM           │
│             ▼                      ▼                       │
│  ┌──────────────────┐  ┌──────────────────────┐           │
│  │  NextAuth.js      │  │    Neon (Postgres)    │           │
│  │  - Email/password │  │  users | vehicles      │           │
│  │  - Google OAuth   │  │  trips | odometer_r    │           │
│  │  - JWT sessions   │  │  tax_year_summaries   │           │
│  └──────────────────┘  └──────────────────────┘           │
│                                                             │
│  External:                                                  │
│  ┌────────────┐  ┌───────────┐  ┌───────────────────┐     │
│  │ OpenStreet │  │   OSRM    │  │  @react-pdf       │     │
│  │ Map Tiles  │  │  Routing  │  │  (PDF generation) │     │
│  │ (leaflet)  │  │  Machine  │  │                   │     │
│  └────────────┘  └───────────┘  └───────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

## Authentication

- **NextAuth.js v5** with two providers:
  1. Credentials (email + hashed password via bcrypt)
  2. Google OAuth
- JWT-based sessions (no database session store needed)
- Middleware protects all routes except `/`, `/auth/*`
- User created on first sign-in (for OAuth) or on registration

## Pages & Routes

### `/` — Landing
Public landing page with sign-up/login buttons

### `/auth/*` — Authentication pages
- `/auth/login` — Email/password or Google sign-in
- `/auth/register` — Create account
- `/auth/error` — Auth error display

### `/dashboard` — Home (after login)
- Current tax year summary cards: total km, business km, business %, estimated deduction
- Recent trips list (last 10)
- Quick "Log a Trip" button
- Per-vehicle odometer status (is opening reading set for this year?)

### `/trips` — Trip list
- Filter by tax year, vehicle, date range
- Table/card view with expandable details
- Edit/delete actions

### `/trips/new` — Log a trip
- **Manual tab:** Form with date, vehicle, start/end odometer, start/end location (text), purpose, business/private toggle
- **Map tab:** Leaflet map with start/end markers, OSRM route overlay, auto-fills distance. Still editable.
- Auto-calculates totalKm, auto-assigns taxYear

### `/trips/[id]` — View/Edit trip

### `/vehicles` — Vehicle management
- List of user's vehicles
- Per vehicle: set opening/closing odometer for tax year
- Add vehicle form

### `/reports` — SARS Reports
- Select tax year
- Per-vehicle breakdown:
  - Opening/closing odometer, total km
  - Business km count, business %
  - Scale-of-costs deductible estimate
  - Download SARS PDF button

### `/api/*` — API routes
- `/api/auth/*` — NextAuth.js (framework-managed)
- `/api/osrm/route` — Server-side proxy to OSRM routing (avoids client CORS)
- All CRUD operations use Next.js **Server Actions**, not REST API routes

## SARS Deduction Calculation

### Scale of Costs Method (built-in)
The app will include the SARS rate tables (fixed cost, fuel, maintenance per vehicle value bracket). When a user generates a report:

1. Fixed cost × (business km / total km) = fixed cost deduction
2. Business km × fuel rate per km = fuel deduction
3. Business km × maintenance rate per km = maintenance deduction
4. Total = fixed + fuel + maintenance (capped appropriately)

### Actual Costs Method (manual)
User enters actual expenses (fuel, maintenance, insurance, lease, licence). App calculates:
- Business % = business km / total km
- Deduction = sum(expenses) × business %

## PDF Report (SARS Logbook)

Generated with `@react-pdf/renderer` on demand. Contains:
- Header: User name, tax year, vehicle details
- Opening/closing odometer, total km
- Table of all business trips: date, start/end odometer, km, from→to, purpose
- Summary: total business km, business %, deductible amount
- Footer: SARS note about 5-year record retention

## Multi-tenancy

- Every data table has a `userId` column
- All queries filter by session's `userId`
- No shared data between users
- Row-level security enforced at application layer

## Concurrent Users

- Neon Postgres pooled connections handle concurrent access
- Vercel serverless functions are stateless and scale horizontally
- No in-memory state, no race conditions on writes (per-user data isolation)
- Trips can be logged simultaneously by different users without conflict

## Future Considerations (out of scope for v1)

- Mobile app (PWA)
- CSV import from other logbook tools
- Employer-side dashboard (for fleet managers)
- Automated reminder to set opening odometer on 1 March
- Multi-language (currently English only)

## Repository Setup

- Run `npx create-next-app@latest` with TypeScript, App Router, Tailwind
- Add `.superpowers/` to `.gitignore` (brainstorming artifacts)
- Initialize Drizzle with Neon connection
- Initialize NextAuth.js v5

## Deploy

- Vercel project linked to Git repository
- Environment variables:
  - `DATABASE_URL` — Neon connection string
  - `AUTH_SECRET` — NextAuth.js secret
  - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
  - `NEXT_PUBLIC_OSRM_BASE_URL` — OSRM public endpoint
