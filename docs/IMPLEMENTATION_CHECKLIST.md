# Implementation Checklist — ONE OF A KIND FASHION

## Phase 1 — Project Foundation ✅

- [x] Monorepo with pnpm workspaces (`apps/*`, `packages/*`)
- [x] Next.js App Router + TypeScript + Tailwind (`apps/web`)
- [x] Express + TypeScript API skeleton (`apps/api`)
- [x] Shared package with enums, money helpers, Zod schemas
- [x] MongoDB connection module (Atlas-compatible)
- [x] Environment validation + `.env.example`
- [x] Centralised error handling, logging, CORS, Helmet, rate limit
- [x] Health endpoint `/api/v1/health`
- [x] Root README + scripts
- [x] Install dependencies; shared + API tests passing; typecheck clean

## Phase 2 — Design System ✅ (core)

- [x] Brand colours + serif/sans typography
- [x] Button, Input, Badge, Container, SectionHeading
- [x] Product card
- [x] Storefront header / footer / mobile drawer / announcement bar
- [x] Homepage hero + category / why-us sections
- [x] Admin shell layout (sidebar + top bar)
- [ ] Full shadcn/ui kit expansion
- [ ] Motion polish across all listing pages

## Phase 3 — Data & Catalogue ✅ (core)

- [x] Mongoose models (User, Category, Collection, Product, Cart, Order, Payment, Coupon, Review, InventoryAdjustment, Banner, ContentPage, StoreSettings, Newsletter, AuditLog)
- [x] Category + product public APIs
- [x] Admin catalogue mutation routes (auth-protected)
- [x] Seed script for category tree + demo product
- [x] Variant stock awareness in product detail
- [ ] Cloudinary upload pipeline
- [ ] CSV import/export
- [ ] Inventory adjustment admin UI

## Phase 4 — Customer Storefront ✅ (core)

- [x] Homepage with live New Arrivals from API
- [x] Shop All + category PLPs
- [x] Product detail with variant selection
- [x] Cart page (client, cookie session)
- [x] Account login / register / profile shell
- [ ] Wishlist UI wired to API
- [ ] Search autocomplete page
- [ ] CMS-driven homepage banners
- [ ] Policy / FAQ / About content pages from CMS

## Phase 5 — Commerce 🚧

- [x] Auth (Argon2id, express-session + Mongo store, HTTP-only cookies)
- [x] `pnpm create-admin` bootstrap
- [x] Persistent guest + user carts, merge on login
- [x] Add to cart with server-side stock checks
- [x] Checkout endpoint + Stripe Checkout session creation
- [x] Clear error when Stripe is not configured
- [x] Idempotent paid-order helper for webhooks
- [ ] Stripe webhook HTTP route + raw body verification
- [ ] Order history / tracking customer UI
- [ ] Email notifications
- [ ] Coupon application at checkout

## Phase 6 — Admin Panel 🚧

- [x] Admin layout shell
- [x] Dashboard placeholder
- [x] Products table (live published list)
- [ ] Full product create/edit forms with images + variants
- [ ] Orders latest table + detail + fulfillment transitions
- [ ] Customers, discounts, CMS, settings, reports, audit logs
- [ ] Role permissions matrix enforcement beyond admin role

## Phase 7 — Quality & Launch ⏳

- [x] Initial unit tests (money + health)
- [ ] Broader unit/integration/e2e suite
- [ ] SEO sitemap/robots/JSON-LD
- [ ] Deployment guide
- [ ] Launch readiness checklist completion

---

## Configuration still required

| Variable / service | Status |
| --- | --- |
| `MONGODB_URI` | Working locally (127.0.0.1:27017) |
| `SESSION_SECRET` | Dev default present — rotate before launch |
| Stripe keys | **Required for real checkout** |
| Cloudinary | Required for product image uploads |
| Email provider | Required for transactional mail |
| Admin password | Change `ADMIN_INITIAL_PASSWORD` after first login |

## Verified locally

- API health with MongoDB connected
- Seed categories + demo product persisted
- Admin user created via `pnpm create-admin`
- Login session + `/auth/me`
- Add to cart with variant stock validation
- Typecheck clean for shared, api, web
- Tests: shared money (5) + API health (1) passing
