# Landing Page & Auth Flow Improvements

## Overview

Replace the basic landing page with a polished Modern SaaS design, update the app's accent colors to match, redirect sign-out to the landing page, and auto-sign-out after 5 minutes of inactivity.

## Components

### 1. Landing Page (`/`)

- Modern SaaS hero with dark gradient background (indigo/purple tones)
- Stats row: trips logged, deductions tracked, SARS compliance
- Feature grid with colored side-bar accents (3 cards)
- Testimonial section
- CTA banner
- Footer
- Redirects authenticated users to `/dashboard`
- No client JS needed (server-rendered landing page)

### 2. App Color Scheme Update

- `--accent`: `#d4a843` (gold) → `#6366f1` (indigo-500)
- `--accent-light`: `#e8c56a` (gold-light) → `#818cf8` (indigo-400)
- `--accent-dark`: `#b8912e` (gold-dark) → `#4f46e5` (indigo-600)
- `--on-accent`: remains `#ffffff`
- Light and dark modes both updated

### 3. Sign-Out Redirect → Landing Page

- Use next-auth's `signOut()` with `{ callbackUrl: "/" }`
- Update the nav-menu sign-out link to use the `signOut` function from `next-auth/react`
- This redirects the user to the landing page after session is cleared

### 4. Auto Sign-Out After 5 Minutes

- New client component `InactivityLogout`
- Tracks: mousemove, keydown, click, scroll, touchstart
- Resets a 5-minute timer on each activity event
- When timer expires, calls `signOut({ callbackUrl: "/" })`
- Only mounted on authenticated pages (server check)
- Cleanup on unmount

## Files Changed

| File | Change |
|------|--------|
| `src/app/globals.css` | Update accent color variables |
| `src/app/page.tsx` | Replace with polished landing page + auth redirect |
| `src/components/nav-menu.tsx` | Change sign-out to use `signOut()` with redirect |
| `src/components/inactivity-logout.tsx` | NEW - auto-logout component |
| `src/app/dashboard/page.tsx` | Mount InactivityLogout |
| `src/app/trips/page.tsx` | Mount InactivityLogout |
| `src/app/vehicles/page.tsx` | Mount InactivityLogout |
| `src/app/reports/page.tsx` | Mount InactivityLogout |

## Edge Cases

- Auto-logout timer is per-page (unmounts on navigation, remounts on next page)
- Timer is cleared on unmount to prevent memory leaks
- Only on authenticated pages — landing page, login, register do NOT mount InactivityLogout
- No activity on the landing page is fine (unauthenticated users don't get logged out)
