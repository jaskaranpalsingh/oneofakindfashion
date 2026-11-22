# ONE OF A KIND FASHION

Premium Canadian ethnic fashion e-commerce platform for Indian traditional clothing, wedding outfits, and jewellery.

**Store:** 1283 Millbourne Road East NW, Edmonton, Alberta, Canada  
**Phone:** 587-937-4570  
**Email:** Oneofakindfashion11@gmail.com  
**Currency:** CAD

---

## Architecture

```
e-commerce/   (monorepo root)
  apps/
    web/          Next.js App Router — storefront + /admin
    api/          Express REST API — business logic & MongoDB
  packages/
    shared/       Shared Zod schemas, enums, money helpers, types
```

| Layer | Responsibility |
| --- | --- |
| `apps/web` | UI only. Calls the API. Never holds MongoDB or Stripe secrets. |
| `apps/api` | Auth, catalogue, cart, checkout, payments, admin operations. |
| `packages/shared` | Contracts shared by both apps (validation + domain enums). |
| MongoDB | Persistent catalogue, inventory, customers, orders. |

### Key data relationships

- **User** → addresses, wishlist, carts, orders
- **Category** (tree) → products
- **Collection** → featured product groupings
- **Product** → variants (size/colour SKUs), images, inventory
- **Cart** → line items referencing product + variant
- **Order** → immutable line-item snapshots, payment records, fulfillment status
- **Coupon / Review / Content / StoreSettings** → commerce + CMS configuration

Prices are stored as **integer cents** (CAD minor units).

---

## Required external services

| Service | Purpose | Required to launch? |
| --- | --- | --- |
| MongoDB (local or Atlas) | Primary database | **Yes** |
| Stripe | Checkout / Apple Pay / Google Pay | **Yes** for real payments |
| Cloudinary | Product image storage | Recommended |
| Resend / SMTP | Transactional email | Recommended |

Transactions (checkout + inventory) need a **MongoDB replica set or Atlas cluster**.

---

## Quick start

### Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB running locally **or** an Atlas connection string

```bash
npm install -g pnpm@9
```

### 1. Install

```bash
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` and set at least `MONGODB_URI` and `SESSION_SECRET`.

### 3. Build shared package

```bash
pnpm --filter @ookf/shared build
```

### 4. Run the full project

```bash
npm run dev
```

This starts:
- API → http://localhost:4000
- Website + Admin → http://localhost:3000

Or run them separately:

```bash
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:3000
```

### 5. Health check

```bash
curl http://localhost:4000/api/v1/health
```

### Useful scripts

| Command | Description |
| --- | --- |
| `pnpm create-admin` | Bootstrap initial admin (Phase 5+) |
| `pnpm seed` | Optional demo catalogue seed (Phase 3+) |
| `pnpm test` | Run automated tests |
| `pnpm build` | Production build |
| `pnpm lint` | Lint packages |

---

## Ports & CORS

| App | Default port |
| --- | --- |
| Next.js storefront | `3000` |
| Express API | `4000` |

API CORS allows credentials from `WEB_ORIGIN` (default `http://localhost:3000`).

---

## Implementation status

See [docs/IMPLEMENTATION_CHECKLIST.md](docs/IMPLEMENTATION_CHECKLIST.md).

**Phase 1 (foundation)** is the current completed baseline.

---

## Security notes

- Secrets stay in server env / secrets manager — never in client bundles.
- Session cookies will be HTTP-only (Phase 5).
- Stripe webhooks are signature-verified; orders are never marked paid from the browser alone.
- Admin permissions are enforced on API routes, not just by hiding UI.
