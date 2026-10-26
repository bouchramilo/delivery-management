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
git clone <your-repository-url>
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
3. Confirm tables exist: `delivery_zones`, `products`, `product_zones`, `orders`.
4. Confirm RLS is enabled and the `create_order_atomic` function is granted to `authenticated`.

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
2. Import the repo in Vercel (framework: Next.js).
3. Add environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy and update Supabase auth URLs to the production domain.
5. Re-test sign-in, protected routes, maps, orders, and dashboard on HTTPS.

**Production URL:** _Add after you deploy._

**GitHub repository:** _Add after you push._

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

- Cursor Agent (Composer) for implementation scaffolding, API routes, SQL migration, UI, and documentation.
