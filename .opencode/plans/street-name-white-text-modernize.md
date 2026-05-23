# Plan: Street name + white text + modernize

## 1. Reverse geocode — add street to start location

**File:** `src/app/api/geocode/reverse/route.ts`

Changes:
- Add `addr.road` + `addr.house_number` to priority chain (street comes first)
- Build cleaner `displayName` using street + suburb (skip raw Nominatim display_name when possible)

```ts
const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
const shortName = street || neighbourhood || suburb || addr.city_district || city || addr.county || addr.state || `${lat}, ${lon}`;
const displayName = [shortName, cleanName].filter(Boolean).join(", ") || data.display_name;
```

## 2. Hamburger menu — fix white text

**File:** `src/components/nav-menu.tsx`

- Add `text-gray-700` to hamburger button
- Add `text-gray-900` to each nav link `<a>`
- Backdrop: `bg-black/20` → `bg-black/30 backdrop-blur-sm`
- Panel: `shadow-xl` → `shadow-2xl`

## 3. Modernize cards

**File:** `src/components/dashboard-cards.tsx`
- Each card: `border rounded-lg` → `shadow-sm rounded-xl border border-gray-100`
- Add `hover:shadow-md transition-shadow duration-200`

**File:** `src/components/recent-trips.tsx`
- Each trip link: `p-3 border rounded-lg` → `p-4 border border-gray-100 rounded-xl shadow-sm`
- Add `hover:shadow-md transition-shadow duration-200`

**File:** `src/app/trips/page.tsx`
- Each trip link: same card upgrade: `rounded-xl shadow-sm hover:shadow-md transition-shadow`
- Badge: `rounded` → `rounded-full`

## 4. Modernize form

**File:** `src/components/trip-form.tsx`
- Map container: `border rounded-lg` → `border border-gray-200 rounded-xl shadow-sm`

**File:** `src/components/address-search.tsx`
- Dropdown `<ul>`: `rounded` → `rounded-lg shadow-lg`

## 5. Modernize layout

**File:** `src/app/layout.tsx`
- Nav: add `shadow-sm border-gray-200`
- No other changes

**File:** `src/app/globals.css`
- Remove the dark mode `@media (prefers-color-scheme: dark)` block
- Add `html { scroll-behavior: smooth; }`

## Execution order

1. First: `geocode/reverse/route.ts` + `nav-menu.tsx` (independent)
2. Then: `dashboard-cards.tsx` + `recent-trips.tsx` + `trips/page.tsx` (independent)
3. Then: `trip-form.tsx` + `address-search.tsx` (independent)
4. Then: `layout.tsx` + `globals.css`
5. Build + commit + push
