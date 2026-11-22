# API Documentation — ONE OF A KIND FASHION

Base URL (local): `http://localhost:4000/api/v1`

All JSON responses use:

```json
{ "success": true, "data": {} }
```

or

```json
{ "success": false, "error": { "code": "CODE", "message": "..." } }
```

Authentication uses HTTP-only session cookies (`ookf_session`). Send `credentials: "include"` from the browser.

## Public

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service + DB + integration status |
| GET | `/categories` | Visible categories |
| GET | `/categories/:slug` | Category by slug |
| GET | `/products` | Published products (filters + pagination) |
| GET | `/products/:slug` | Product detail + variants |
| GET | `/cart` | Current guest/user cart |
| POST | `/cart/items` | Add item `{ productId, variantId, quantity }` |
| PATCH | `/cart/items/:itemId` | Update quantity |
| DELETE | `/cart/items/:itemId` | Remove item |
| POST | `/cart/merge` | Merge guest cart after login |
| POST | `/checkout` | Create order + Stripe Checkout session |

## Auth

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/register` | Create customer account |
| POST | `/auth/login` | Sign in (rate limited) |
| POST | `/auth/logout` | Destroy session |
| GET | `/auth/me` | Current user |

## Admin (requires admin session)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/admin/categories` | Create category |
| PATCH | `/admin/categories/:id` | Update category |
| DELETE | `/admin/categories/:id` | Archive category |
| POST | `/admin/products` | Create product |
| PATCH | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Archive product |

## Product query params

`q`, `category`, `collection`, `minPrice`, `maxPrice`, `size`, `colour`, `fabric`, `jewelleryType`, `occasion`, `availability`, `onSale`, `sort`, `page`, `pageSize`

Sort values: `featured`, `newest`, `price_asc`, `price_desc`, `name`, `best_selling`

## Configuration-dependent features

| Feature | Required env |
| --- | --- |
| Checkout / Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Image uploads | Cloudinary keys |
| Transactional email | `EMAIL_PROVIDER_KEY`, `EMAIL_FROM` |
