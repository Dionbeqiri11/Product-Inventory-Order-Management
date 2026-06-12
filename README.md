# Product Inventory & Order Management

A full-stack inventory and order management system. Customers authenticate, browse
products, and place orders that draw down inventory. The core design goal is
**correct inventory accounting under concurrency** — orders can never oversell
stock, even when many arrive at the same instant.

- **Backend:** Node.js · TypeScript · Express · MongoDB (Mongoose) · zod · JWT
- **Frontend:** React · TypeScript · Vite
- **Infra:** Docker · Docker Compose · nginx

---

## Quick start (Docker)

The entire stack runs with one command:

```bash
docker compose up --build
```

| Service | URL | Notes |
| ------- | --- | ----- |
| Web (nginx + React) | http://localhost:8080 | proxies `/api` to the API |
| API (Express) | http://localhost:4000 | REST API |
| MongoDB | localhost:27017 (internal) | named volume `mongo-data` |

Open **http://localhost:8080**, register an account, add a product, and place an order.

> Set a real `JWT_SECRET` in production: `JWT_SECRET=... docker compose up`.

---

## Local development

Backend:

```bash
cd backend
cp .env.example .env      # adjust MONGO_URI / JWT_SECRET if needed
npm install
npm run dev               # http://localhost:4000
npm test                  # Vitest + mongodb-memory-server (no external DB needed)
```

Frontend:

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (proxies /api to :4000)
```

---

## Architecture

```
frontend/                 React SPA (Vite)
  src/
    api.ts                typed fetch client (attaches JWT)
    components/           AuthPanel, Dashboard
backend/
  src/
    config/               env validation, logger, db connection
    middleware/           auth, body validation, error handling
    api/
      auth/               user model, register/login, JWT, /me
      products/           model, repository, service, controller, routes
      orders/             model, repository, service (reservation logic), routes
      health/             liveness/readiness probe
  tests/                  integration tests incl. the concurrency suite
```

The backend follows a **layered architecture** so responsibilities stay separated
and testable:

- **routes** — wire HTTP verbs to handlers, attach auth + validation middleware
- **controller** — translate HTTP ⇄ domain calls (thin)
- **service** — business rules (reservation, compensation, not-found handling)
- **repository** — all Mongoose/data-access details
- **model** — schema + typed interface

Validation happens at the edge with **zod** schemas; a centralized error handler
maps `AppError`, `ZodError`, and Mongoose cast/duplicate-key errors to consistent
JSON responses.

---

## Concurrency: how overselling is prevented

The hard part of an order system is the stock decrement. A naive
"read stock → check → write stock" sequence has a race: two concurrent orders can
both read `stock = 1`, both pass the check, and both write `stock = 0` — selling the
same unit twice.

This system avoids that by making the decrement a **single atomic, conditional
update** in MongoDB:

```ts
ProductModel.findOneAndUpdate(
  { _id: id, stock: { $gte: quantity } }, // guard: only if enough stock
  { $inc: { stock: -quantity } },         // atomic decrement
  { new: true },
);
```

MongoDB applies the filter and the `$inc` as one atomic operation on the document,
so concurrent reservations are effectively serialized: only the requests for which
stock is still sufficient succeed. If the document doesn't match (insufficient
stock), `findOneAndUpdate` returns `null` and the order is rejected with `409`.
Stock can never go negative.

**Multi-item orders** reserve each line independently. If a later line fails, every
already-reserved line is **compensated** (released via `$inc: +quantity`), so an
order is all-or-nothing without needing a distributed transaction:

```
reserve A (ok) → reserve B (fails) → release A → reject order (409)
```

This is proven by an automated test that fires 12 concurrent orders for the last
remaining unit and asserts **exactly one** succeeds while stock lands at `0`.

---

## API reference

Base URL: `/api/v1`. Authenticated requests send `Authorization: Bearer <token>`.

> **Roles.** Users have a `role` of `user` (default for self-registration) or
> `admin`. Only admins can create/update/delete products. Conversely, placing
> orders is a customer action — only `user` accounts can order; admins manage the
> catalog. Anyone signed in can browse products. A bootstrap admin is seeded from
> `ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults `admin@example.com` / `admin12345`
> in Docker). An existing user with that email is promoted to admin.

### Auth

| Method | Path | Auth | Body | Description |
| ------ | ---- | ---- | ---- | ----------- |
| POST | `/auth/register` | – | `{ name, email, password }` | Create account, returns `{ token, user }` |
| POST | `/auth/login` | – | `{ email, password }` | Returns `{ token, user }` |
| GET | `/auth/me` | ✅ | – | Current token's payload |

### Products

| Method | Path | Auth | Body | Description |
| ------ | ---- | ---- | ---- | ----------- |
| GET | `/products` | – | `?page&limit` | List products (paginated) |
| GET | `/products/:id` | – | – | Get one product |
| POST | `/products` | admin | `{ name, sku, priceCents, stock, description? }` | Create |
| PATCH | `/products/:id` | admin | partial product | Update |
| DELETE | `/products/:id` | admin | – | Delete |

### Orders

| Method | Path | Auth | Body | Description |
| ------ | ---- | ---- | ---- | ----------- |
| POST | `/orders` | user | `{ items: [{ productId, quantity }] }` | Place order (atomic reservation); admins are forbidden |
| GET | `/orders` | ✅ | `?page&limit` | List the user's orders (paginated) |
| GET | `/orders/:id` | ✅ | – | Get one of the user's orders |

Prices are stored and returned as integer **cents** (`priceCents`, `totalCents`,
`unitPriceCents`) to avoid floating-point rounding errors.

**Pagination.** List endpoints accept `page` (1-based, default `1`) and `limit`
(default `20`, max `100`) and return an envelope:

```json
{ "data": [ ... ], "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
```

**Example — place an order**

```bash
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "items": [{ "productId": "<id>", "quantity": 2 }] }'
```

| Status | Meaning |
| ------ | ------- |
| `201` | Order confirmed, stock reserved |
| `400` | Validation error (bad body) |
| `401` | Missing/invalid token |
| `404` | Product not found |
| `409` | Insufficient stock (or duplicate SKU on product create) |

---

## Testing

```bash
cd backend && npm test
```

Tests run against an in-memory MongoDB (`mongodb-memory-server`), so no external
database is required. Coverage includes auth flows, product CRUD + validation,
order placement, stock decrement, multi-line compensation, user scoping, and the
concurrency oversell guard.

---

## Design decisions

- **Price in cents** — integers avoid floating-point money bugs.
- **Atomic conditional update over transactions** — simpler and works on a
  standalone MongoDB; the guarded `findOneAndUpdate` is sufficient for
  single-document stock safety, with application-level compensation for
  multi-item orders.
- **Denormalized order line items** — each order stores the product's `sku`,
  `name`, and `unitPriceCents` at purchase time, so order history stays accurate
  if a product is later repriced, renamed, or deleted.
- **Layered structure** — keeps business logic out of controllers and data access
  out of services, which is what makes the concurrency logic easy to unit-test.

