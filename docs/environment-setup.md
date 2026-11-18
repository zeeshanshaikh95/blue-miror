# Blue Miror — Environment Setup

## 1. Prerequisites

- Node.js 22.x (matches CI and Render)
- npm 10.x
- A local or Atlas MongoDB database
- Optional: a Cloudinary account (only needed for image uploads)

## 2. Install

```bash
npm install            # installs both workspaces
npm run dev            # client :5173 + server :4000
```

Other root scripts: `npm run build`, `npm run test`, `npm run lint`,
`npm run typecheck`, `npm run format`.

## 3. Server environment (`server/.env`)

Copy `server/.env.example` and fill in values. The server validates the whole
environment at boot and refuses to start when a value is missing or unsafe.

| Variable                     | Required    | Purpose                                                     |
| ---------------------------- | ----------- | ----------------------------------------------------------- |
| `NODE_ENV`                   | yes         | `development` / `test` / `production`                       |
| `PORT`                       | no (4000)   | HTTP port                                                   |
| `MONGODB_URI`                | yes         | Mongo connection string, database `blue_miror`              |
| `JWT_SECRET`                 | yes         | Session token signing key (≥ 32 chars in dev, ≥ 48 in prod) |
| `JWT_ISSUER`, `JWT_AUDIENCE` | no          | Token claims; defaults are `blue-miror`                     |
| `SESSION_TTL_MINUTES`        | no (60)     | Session lifetime                                            |
| `ADMIN_LOGIN_EMAIL`          | yes         | Bootstrap administrator email                               |
| `ADMIN_LOGIN_PASSWORD`       | yes         | Bootstrap administrator password (≥ 12 chars)               |
| `ADMIN_BOOTSTRAP_SECRET`     | yes         | Header value for the one-time bootstrap route               |
| `CORS_ORIGINS`               | yes         | Comma-separated allowed client origins                      |
| `PUBLIC_SITE_URL`            | yes         | Canonical public origin                                     |
| `CLOUDINARY_CLOUD_NAME`      | no          | Enables uploads when all three are set                      |
| `CLOUDINARY_API_KEY`         | no          | See above                                                   |
| `CLOUDINARY_API_SECRET`      | no          | Server-only; never exposed to the client                    |
| `RATE_LIMIT_*`               | no          | Window/max overrides                                        |
| `TRUST_PROXY`                | no          | Set to `1` behind a reverse proxy                           |
| `LOG_LEVEL`                  | no (`info`) | pino level                                                  |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Never commit `.env`. `.env.example` documents names only.

## 4. Client environment (`client/.env`)

| Variable              | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `VITE_API_BASE_URL`   | API root, e.g. `http://localhost:4000/api` (default)      |
| `VITE_SITE_URL`       | Canonical public origin, used by the sitemap generator    |
| `VITE_ALLOW_INDEXING` | `true` only when the site is approved for search indexing |

Only `VITE_*` values reach the browser. Never put secrets in them.

## 5. Database

- Development: point `MONGODB_URI` at a local `mongod` or an Atlas dev cluster.
- Tests: `server/vitest.config.ts` injects safe values and spins up
  `mongodb-memory-server`; no external database is contacted.
- Schema changes are additive with defaults; existing documents remain valid.

## 6. Admin bootstrap

1. Set `ADMIN_LOGIN_EMAIL` and `ADMIN_LOGIN_PASSWORD`.
2. Call the bootstrap route once with the bootstrap secret header:

```bash
curl -X POST http://localhost:4000/api/auth/bootstrap \
  -H "x-bootstrap-secret: $ADMIN_BOOTSTRAP_SECRET"
```

3. Sign in at `/admin/login`.
4. Change the password from **Account** (`/admin/account`). This revokes all
   sessions, so sign in again with the new password.
5. Rotate `ADMIN_BOOTSTRAP_SECRET` in the environment afterwards.

Public admin registration does not exist and must not be added.

## 7. Common failures

| Symptom                                 | Cause                                                               |
| --------------------------------------- | ------------------------------------------------------------------- |
| `Environment validation failed` at boot | Missing/short secret or `http://` CORS origin in production         |
| `Not allowed by CORS`                   | Client origin missing from `CORS_ORIGINS` (include scheme and port) |
| Uploads return `503 MEDIA_UNAVAILABLE`  | Cloudinary variables unset — the API refuses rather than pretending |
| `429` on login                          | Login throttle; wait for the cooldown                               |
| 401 immediately after reload            | Sessions are in-memory by design; sign in again                     |
| Tests fail to find env values           | Run `npm test` inside `server/` so `vitest.config.ts` is used       |
