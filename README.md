# Delivery Management Web App

A mobile-first delivery operations dashboard built with Next.js and Supabase. Authenticated users manage products, circular delivery zones on an interactive map, product-to-zone assignments, and customer orders with server-side geographic validation and atomic stock updates.

## Features

- Email/password authentication (sign up, sign in, sign out, session refresh)
- Product CRUD with stock and multi-zone assignments
- Delivery zone CRUD with Leaflet + OpenStreetMap (click-to-set center, radius circles)
- Order creation with map-based customer location and coverage preview
- Authoritative server validation (Haversine distance + `create_order_atomic` RPC)
- Dashboard summaries: zones, stock, orders, products/orders grouped by zone
- Row Level Security on all user-owned tables

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide, React Hook Form, Zod, React Leaflet
- **Backend:** Next.js Route Handlers, Supabase PostgreSQL, Supabase Auth, `@supabase/ssr`
- **Deployment:** Vercel + Supabase (recommended)

## Prerequisites

- Node.js 20+
- A Supabase project
- npm (or your project package manager)

## Installation

```bash
git clone https://github.com/bouchramilo/delivery-management.git
cd delivery-management
npm install
cp .env.example .env.local
```

Fill in `.env.local` from the Supabase dashboard (**Project Settings → API**):

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Publishable key (`sb_publishable_…`)

Never commit `.env.local` or expose the `service_role` key.

## Database migration (required)

If the app shows **“Something went wrong”** on every page, the Supabase tables have not been created yet.

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard) → **SQL** → **New query**.
2. Paste and run the **entire** file `supabase/migrations/001_delivery_management.sql`.
3. Confirm success (no errors in the SQL output).
4. Confirm tables exist: `delivery_zones`, `products`, `product_zones`, `orders`.
5. Confirm RLS is enabled and the `create_order_atomic` function is granted to `authenticated`.

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register a new account (disable email confirmation in Supabase Auth settings for faster local testing, or confirm via email).

### Auth redirect URLs (Supabase)

In **Authentication → URL configuration**, set:

- **Site URL:** `http://localhost:3000` (and your production URL when deployed)
- **Redirect URLs:** `http://localhost:3000/auth/callback`, `https://<your-vercel-domain>/auth/callback`

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/products` | List / create products |
| PATCH/DELETE | `/api/products/[id]` | Update / delete product |
| GET/POST | `/api/zones` | List / create zones |
| PATCH/DELETE | `/api/zones/[id]` | Update / deactivate / delete zone |
| GET/POST | `/api/orders` | List / create order (atomic RPC) |
| GET | `/api/dashboard` | Aggregated stats for current user |
| POST | `/api/auth/logout` | Sign out |

All mutating routes require a valid Supabase session cookie. User IDs are always taken from the server session, never from the request body.

### Order validation

1. Client sends `productId`, `quantity`, `customerLat`, `customerLng` only.
2. `POST /api/orders` validates with Zod and calls `create_order_atomic`.
3. The RPC locks the product row, checks stock, loads active assigned zones for the owner, applies the same Haversine rule as `lib/delivery/zone-selection.ts`, picks the closest eligible zone (UUID tie-break), decrements stock, and inserts an `accepted` order with price snapshots.
4. If no zone covers the point or stock is insufficient, the transaction rolls back and the API returns `422` with a structured error code.

## Security notes

- RLS restricts all tables to `auth.uid()`.
- `product_zones` enforces matching ownership via trigger.
- Order creation does not accept client-supplied zone, price, or user id.
- Publishable key only in `NEXT_PUBLIC_*` variables.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # start production server
npm run lint     # ESLint
```

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new) (framework: **Next.js**).
3. Add environment variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy. Copy the **HTTPS** URL (e.g. `https://delivery-management.vercel.app`).
5. In Supabase **Authentication → URL configuration**:
   - **Site URL:** your Vercel production URL
   - **Redirect URLs:** `https://<your-domain>/auth/callback` (and localhost for local dev)
6. Run the SQL migration on the **same** Supabase project used in Vercel env vars.
7. Smoke-test on desktop and phone: sign up/in, refresh on `/dashboard`, maps, order inside/outside zone.

---

## Challenge submission (copy for your report)

| Deliverable | Link |
|-------------|------|
| **Live app (HTTPS)** | _Set after Vercel deploy — e.g. `https://….vercel.app`_ |
| **GitHub repository** | https://github.com/bouchramilo/delivery-management |
| **Setup & deploy** | This README (Installation, Database migration, Deploy to Vercel) |
| **Test credentials** | See [Test account for reviewers](#test-account-for-reviewers) below |
| **AI tools** | See [AI tools used](#ai-tools-used) below |

### Requirements coverage

| Requirement | Implementation |
|-------------|----------------|
| Sign up / log in / log out | `/signup`, `/login`, `POST /api/auth/logout`, Supabase Auth + session cookies |
| Products (name, price, qty) + list + zone assignment | `/products` drawer CRUD, `product_zones` many-to-many |
| Delivery zones (map, name, radius, circles) | `/zones` with Leaflet/OSM, `ZoneMapEditor`, km radius stored in DB |
| Orders (product, qty, map location, zone check) | `/orders` drawer + `POST /api/orders` + `create_order_atomic` RPC; client preview via `selectBestDeliveryZone` |
| Reject outside zones | API `422` + toast: location outside available zones |
| Accepted orders + assigned zone | Orders list with zone name; status `accepted` |
| Dashboard | `/dashboard` — KPIs, products by zone, orders by zone |
| Mobile-first UI | Responsive shell, mobile nav, drawers, scrollable lists |
| Live deployment | Vercel + Supabase env vars; no secrets in repo |

### Test account for reviewers

Create a dedicated account in production (or share one you control):

```text
Email:    reviewer@your-domain.com
Password: <choose a strong password and paste here for evaluators>
```

Optional: pre-seed zones/products via the UI before sharing.  
For local-only testing, disable **Confirm email** under Supabase Auth → Providers → Email.

## Testing checklist

- [ ] Register / login / logout
- [ ] Refresh a protected page while signed in
- [ ] Direct visit to `/dashboard` while signed out → redirect to login
- [ ] Create product with zone assignments
- [ ] Create zone on map; see circle in km → meters
- [ ] Place order inside zone → stock decreases, order listed
- [ ] Place order outside zones → `422` / error message, stock unchanged
- [ ] Dashboard counts update
- [ ] Mobile layout (sidebar menu)

## AI tools used

This project was built with **AI-assisted development** (allowed by the challenge):

| Tool | How it was used |
|------|------------------|
| **Cursor Agent (Composer)** | End-to-end app: Next.js pages, API routes, Supabase SSR auth, SQL migration (`001_delivery_management.sql`), Leaflet maps, drawers/filters/pagination, dashboard KPIs, landing hero, README |
| **Cursor inline / chat** | Iterative UI fixes (scroll regions, order cards, theme), debugging API/RLS errors, lint/build checks |
| **Supabase docs** (via agent context) | RLS, `create_order_atomic` RPC pattern, publishable key + `@supabase/ssr` |

Human responsibilities: Supabase project ownership, running SQL in the dashboard, setting `.env.local` / Vercel env vars, Git push, and final QA on the live URL.
