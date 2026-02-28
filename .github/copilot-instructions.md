# AeroChain Copilot Instructions

AeroChain 2026 is a hackathon registration portal built with React 19 + Vite + TypeScript, backed by Supabase (auth + PostgreSQL).

## Commands

```bash
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

There is no test suite. ESLint is configured (`eslint.config.js`) but there is no `lint` script — run it directly with `npx eslint .` if needed.

## Project Layout

The app deviates from the standard Vite layout:

- **Entry point**: `/index.tsx` (root, referenced by `index.html`) → renders `App.tsx` (root)
- **`src/`**: Contains only a leftover Vite boilerplate `App.tsx` and `main.tsx` — **not used by the actual app**
- **Active source files live at the project root**: `App.tsx`, `components/`, `services/`, `utils/`, `types.ts`, `constants.ts`
- **`tsconfig.app.json`** only includes `"src"` — TypeScript checking does not cover root-level files

The `@` path alias (configured in `vite.config.ts`) resolves to the **project root**, not `src/`.

## Architecture

The app is a **single-page, router-less application**. All major views (login, registration form, admin dashboard) are modal overlays controlled by boolean state in `App.tsx`. There are no routes.

**State flow in `App.tsx`:**
1. Preloader runs on mount, then reveals main content
2. Supabase `onAuthStateChange` drives `user` state throughout the session
3. Login time is stamped in `localStorage` (`aerochain_login_time`) and checked for a 2-day expiry on every auth state change
4. After login, `getMyRegistration` is called immediately to check for an existing submission; `userRegistration` drives whether UI says "edit" or "new"

**Animation stack:**
- **GSAP** handles all scroll-triggered and enter animations
- **Lenis** provides smooth scrolling
- Critical integration: Lenis scroll events are wired into `ScrollTrigger.update` and the GSAP ticker drives Lenis via `gsap.ticker.add((time) => lenis.raf(time * 1000))`. GSAP lag smoothing is disabled (`lagSmoothing(0)`). This entire setup must be torn down in the `useEffect` cleanup.

**Supabase layer** (`services/supabaseClient.ts`):
- DB columns are `snake_case`; TypeScript types and form state are `camelCase`. All functions in `supabaseClient.ts` perform explicit field mapping in both directions.
- `getMyRegistration` queries by `user_id` OR `lead_email` to handle edge cases where the email differs from the auth user.
- `submitRegistration` falls back to an upsert on `user_id` conflict if the email-based duplicate check finds nothing.

## Key Conventions

**Email validation**: Only SRM IST addresses are accepted. The format is exactly 6 alphanumeric characters + `@srmist.edu.in` (validated by regex in `LoginModal.tsx`). The special alias `main` maps to `main@srmist.edu.in`.

**Supabase `User` type**: `user` state is typed as `any` (not `User` from `@supabase/supabase-js`) throughout `App.tsx` to avoid breakage across Supabase JS v1/v2 differences.

**Admin access**: `verifyAdmin` in `supabaseClient.ts` has hardcoded credentials (`admin` / `aerochain2026`) that short-circuit before the database check.

**Styling**: Tailwind CSS is loaded via CDN in `index.html` — it is **not** installed as a package. Custom CSS (glassmorphism panels, glitch effects, scanlines) is defined in `index.html`'s `<style>` block. The primary accent color is Electric Cyan `#00F0FF`. Global font is JetBrains Mono; headings use Orbitron (both loaded from Google Fonts in `index.html`).

**Excel export** (`utils/exportODList.ts`): `exceljs` is **lazy-loaded** via dynamic `import()` to avoid bloating the main bundle. Vite's `manualChunks` in `vite.config.ts` ensures it lands in its own chunk. The export groups members by branch + academic year (derived from semester number), sorts by a custom branch priority order, and renders per-group OD (On Duty) attendance sheets.

**`RegistrationForm` dependency array**: `user` is intentionally omitted from the `useEffect` that loads `initialData` to prevent the form from wiping state on auth token refresh mid-session.

## Environment Variables

Required in `.env.local`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The client falls back to placeholder strings if these are missing, so the app will start but all Supabase calls will fail silently.
