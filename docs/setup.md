# Blue Miror — Development Setup

> **Status:** Phase 3 public website complete. The responsive public pages, temporary read-only content API and tests are in place. MongoDB models, authentication, admin CRUD and booking persistence arrive in later phases. Nothing has been deployed.

---

## 1. Prerequisites

| Requirement | Version                                  | Notes                                                                                                         |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Node.js     | 22.12+ (tested on 22.19.0)               | Node 22 LTS                                                                                                   |
| npm         | 11+ (tested on 11.21.2)                  | **npm 10 has an Arborist crash on this dependency tree.** Use `npx npm@11.21.2 …` if your global npm is older |
| MongoDB     | Local MongoDB 7/8 or MongoDB Atlas       | A local server is convenient; tests use an ephemeral in-memory MongoDB                                        |
| Cloudinary  | Account optional during public-site work | Required for uploads and production startup                                                                   |
| Git         | Any current version                      | Repository initialized on `main`; no commits have been created yet                                            |

The root `package.json` declares `npm >=11` in `engines` and pins `npm@11.21.2` via `packageManager`.

---

## 2. Install

```bash
npx --yes npm@11.21.2 install
```

or, if your npm is already 11+:

```bash
npm install
```

This installs both workspaces, generates/uses `package-lock.json`, and links `client` and `server` as npm workspaces.

For a clean CI install:

```bash
npx --yes npm@11.21.2 ci
```

---

## 3. Environment configuration

### Server

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and replace the blank secrets.

Generate strong local secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

- Use the output for `JWT_SECRET` (96 hex characters; minimum 32 in development, 64 in production).
- Generate a second value for `ADMIN_BOOTSTRAP_SECRET` (minimum 32 characters; required in production).
- Never use the same secret across projects.

Key values:

| Variable                 | Development                                     | Production                                                 |
| ------------------------ | ----------------------------------------------- | ---------------------------------------------------------- |
| `MONGODB_URI`            | `mongodb://127.0.0.1:27017/blue-miror` or Atlas | Dedicated Atlas URI; localhost is rejected                 |
| `JWT_SECRET`             | Unique random value, 32+ chars                  | Unique random value, 64+ chars, no placeholders            |
| `CORS_ORIGINS`           | `http://localhost:5173`                         | Exact frontend origin(s), comma-separated, **no wildcard** |
| `CLOUDINARY_*`           | Optional for the health check                   | All three required                                         |
| `ADMIN_BOOTSTRAP_SECRET` | Optional now                                    | Required, 32+ chars                                        |
| `TRUST_PROXY`            | `0`                                             | `1` behind Render                                          |

Startup validation rejects invalid or insecure production configuration. Secret values are never printed in validation errors or logs. `.env` is gitignored.

### Client

```bash
cp client/.env.example client/.env
```

`VITE_API_BASE_URL` must include `/api` and has no trailing slash:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SITE_URL=http://localhost:5173
VITE_ALLOW_INDEXING=false
VITE_CLOUDINARY_CLOUD_NAME=
```

Keep `VITE_ALLOW_INDEXING=false` while the site contains placeholder content. Set it to `true` only when approved clinic content, photography, contact details and legal pages are ready.

Only public values belong in `VITE_*` variables. Cloudinary API secrets never go in the client.

A production build **fails intentionally** if `VITE_API_BASE_URL` is missing:

```bash
VITE_API_BASE_URL="https://api.<CLINIC_DOMAIN>/api" \
VITE_SITE_URL="https://www.<CLINIC_DOMAIN>" \
VITE_ALLOW_INDEXING="false" \
npm run build
```

Do not use `.invalid` test values for a real build.

---

## 4. Run locally

If using local MongoDB, start `mongod` first. Otherwise set an Atlas URI in `server/.env`.

```bash
npm run dev
```

If the API exits with `PORT: Too small: expected number to be >=1`, your shell has an inherited `PORT` value (for example `PORT=0`) and dotenv will not override it. Use `PORT=4000 npm run dev`.

| Service | URL                              |
| ------- | -------------------------------- |
| Client  | http://localhost:5173            |
| API     | http://localhost:4000            |
| Health  | http://localhost:4000/api/health |

Root scripts:

```bash
npm run dev          # client + API concurrently
npm run typecheck    # both workspaces
npm run lint         # both workspaces
npm run test         # both workspaces
npm run build        # server, then client (client requires VITE_API_BASE_URL)
npm run format       # Prettier
npm run format:check # Prettier check
npm run verify       # typecheck + lint + test + build (build env required)
```

### Health endpoint

`GET /api/health` returns no secrets or infrastructure details.

Healthy response (`200`):

```json
{
  "status": "ok",
  "uptime": 42,
  "timestamp": "2026-11-15T00:00:00.000Z",
  "checks": { "database": "up" }
}
```

When MongoDB is unavailable (`503`):

```json
{
  "status": "degraded",
  "uptime": 12,
  "timestamp": "2026-11-15T00:00:00.000Z",
  "checks": { "database": "down" }
}
```

In development the API still starts with a degraded health state so the endpoint and CORS can be inspected. In production, a database connection failure logs a fatal error and the process exits for the platform to restart.

### Phase 3 public content API

The public website reads a temporary in-memory content contract so the service pages are genuinely API-driven before MongoDB models exist:

```text
GET /api/public/settings
GET /api/public/services?q=&category=&featured=&limit=
GET /api/public/services/:slug
GET /api/public/gallery
GET /api/public/testimonials
GET /api/public/team
GET /api/public/faqs
```

The data lives in `server/src/content/public-content.ts` and is marked `isDemo` / `isPlaceholder`. It is not a production seed and will be replaced by Mongoose-backed public endpoints in Phase 4. The API works while MongoDB is down; the health endpoint still reports `degraded` until a database is connected.

---

## 5. MongoDB

- Use a **dedicated** Blue Miror database and user. Do not reuse another project's cluster, database name or credentials.
- Local `MONGODB_URI`: `mongodb://127.0.0.1:27017/blue-miror`.
- Atlas: enable TLS (default with `mongodb+srv://`), use a strong unique password, and configure network access deliberately.
- Mongoose settings currently include `sanitizeFilter`, `strictQuery`, `bufferCommands: false`, a 10-second server-selection timeout and a pool size of 10.
- `autoIndex` is disabled automatically in production; indexes will be created and verified in later phases through an explicit deployment step.
- No domain models or collections exist yet. The public content API in Phase 3 uses a read-only demo contract, not MongoDB. Collections and admin CRUD arrive in Phase 4.

Tests use `mongodb-memory-server`, which downloads and caches a MongoDB binary on first use. That binary is development-only and never used in production.

---

## 6. Cloudinary

Configuration lives in `server/src/config/cloudinary.ts` and is loaded only on the server.

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` must be supplied together.
- Production startup fails if any are missing.
- Folder namespace is controlled by `CLOUDINARY_FOLDER_PREFIX` (default `blue-miror`):
  - `blue-miror/branding`
  - `blue-miror/services`
  - `blue-miror/gallery`
  - `blue-miror/team`
  - `blue-miror/homepage`
- Upload endpoints, magic-byte validation and deletion safeguards are implemented in Phase 4/5. No browser upload preset is exposed, and Phase 3 does not perform live Cloudinary operations.

Use a dedicated Blue Miror Cloudinary account or an approved isolated configuration. Never reuse another client's credentials or folders.

---

## 7. Testing

```bash
npm run test
```

Current coverage: **38 tests**.

| Workspace | Tests | What is checked                                                                                                                                                                                                                                                |
| --------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client    | 20    | Public route rendering, dynamic treatment detail, 404, treatment search/filter, loading and error states, gallery filter, contact placeholders, configured WhatsApp links, accordion and mobile-navigation behavior, health client, central WhatsApp templates |
| Server    | 18    | Production env validation, safe secret errors, MongoDB connection, health 200/503 contract, CORS allow/deny, 404/validation envelopes, public settings/services/gallery/FAQs, placeholder guarantees, empty testimonials and team                              |

The API tests spin up an ephemeral MongoDB and exercise Express over HTTP via Supertest. Public-content tests do not require a database. The first run may be slow while the MongoDB test binary downloads; subsequent runs are fast.

Security and admin CRUD test suites expand in Phases 4–8.

---

## 8. Project structure (current)

```text
client/
  public/brand/blue-miror-logo.png   # unmodified supplied logo
  src/app/                           # providers, lazy public routes
  src/components/{layout,seo,ui}/    # public shell and primitives
  src/hooks/                         # public content queries
  src/layouts/                       # public layout
  src/pages/public/                  # Phase 3 public pages
  src/services/                      # validated public content API
  src/lib/                           # fetch client, query client
  src/styles/                        # Tailwind entry + brand tokens
  src/test/                          # fixtures and test setup
  src/utils/                         # WhatsApp settings, class helper
  vite.config.ts
  vitest.config.ts
  .env.example

server/
  src/app.ts
  src/server.ts
  src/config/{env,database,cloudinary}.ts
  src/content/public-content.ts      # temporary Phase 3 demo contract
  src/middleware/{error,rate-limit}.middleware.ts
  src/routes/health.routes.ts
  src/routes/public.routes.ts
  src/utils/{app-error,logger}.ts
  test/
  tsconfig.json / tsconfig.build.json
  vitest.config.ts
  .env.example

docs/
  setup.md
  01-brand-guidelines.md
  02-implementation-plan.md
  03-client-information-checklist.md
  04-public-site.md
screenshots/
```

The public site is a Phase 3 development preview. It contains sample service records and clearly marked placeholders, and every public page is `noindex` until approved clinic content is ready.

---

## 9. Approved booking architecture (to be implemented in later phases)

These requirements are recorded now so later work follows them:

1. **Service-based only.** No products, cart, checkout, payments or e-commerce functionality.
2. **WhatsApp is the primary booking channel.** The floating button, contact page, service enquiry buttons and booking CTAs all use the centrally configured WhatsApp settings.
3. **Admin-controlled WhatsApp configuration.** Country code, WhatsApp number, default booking message, booking message template and CTA labels live in website settings and are editable from `/admin/settings`. No number or message is hardcoded.
4. **Persist before redirect.** A booking enquiry is validated and stored in MongoDB first. The API then returns a server-generated `wa.me` deep link prefilled with a safe message; the client opens WhatsApp.
5. **No false confirmation.** Opening WhatsApp does not alter appointment status. New requests remain `pending` until an admin explicitly confirms or otherwise updates them. Customers see “request received / pending clinic confirmation” language, never “confirmed”.
6. **No WhatsApp number means no WhatsApp CTA.** Buttons remain hidden until the clinic supplies a verified number.
7. **No sensitive medical data** is collected in the booking form.

---

## 10. Troubleshooting

| Symptom                                                              | Cause / fix                                                                                                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cannot read properties of null (reading 'edgesOut')` during install | npm 10 Arborist bug. Use `npx --yes npm@11.21.2 install`                                                                                                 |
| Startup: `Invalid environment configuration`                         | A required variable is missing or insecure. Generate real secrets; production rejects placeholders, wildcards and localhost Mongo URIs                   |
| Health returns `503` with `database: down`                           | MongoDB is not running or `MONGODB_URI` is wrong. Start MongoDB or fix the Atlas URI; check API logs                                                     |
| `CORS_ORIGIN_DENIED`                                                 | The browser origin is not an exact `CORS_ORIGINS` entry. Do not add a trailing slash or wildcard                                                         |
| Client build says `VITE_API_BASE_URL must be set`                    | Set the public API URL for the build; the client intentionally fails closed                                                                              |
| Dashboard uploads fail with `MEDIA_UNAVAILABLE`                      | Cloudinary credentials are absent or wrong on the API. Set `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET` and restart; nothing is exposed to the browser |
| Tests download MongoDB slowly on first run                           | `mongodb-memory-server` caches the test binary; later runs are fast                                                                                      |

---

## 11. Boundaries

- No production deployment has been performed.
- No real clinic data, WhatsApp numbers, prices, credentials or testimonials exist in the codebase.
- The Phase 3 public site uses sample services and placeholders; it must not be presented as the finished clinic website.
- The temporary public content contract must be replaced with MongoDB-backed endpoints before launch.
- The logo at `client/public/brand/blue-miror-logo.png` is byte-identical to the supplied file. Do not recolour or redraw it.
