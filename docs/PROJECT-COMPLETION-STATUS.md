# Blue Miror — Project Completion Status

> Audit date: 2026-11-18 (final gap closure). This document records what is actually
> implemented in the repository, what is incomplete, and what is blocked on clinic
> input or external configuration. It does not replace
> `02-implementation-plan.md`; it reports against it.

## 1. Stack and shape (as built)

| Area   | Implementation                                                                             |
| ------ | ------------------------------------------------------------------------------------------ |
| Client | React 18.3 + Vite 7 + TypeScript (strict), React Router 7, TanStack Query, Tailwind v4     |
| Server | Node 22, Express 5 + TypeScript (strict), Mongoose 8, Zod, Argon2id, jose, pino            |
| DB     | MongoDB (Atlas in production, `mongodb-memory-server` in tests)                            |
| Media  | Cloudinary, server-mediated upload only (no browser upload preset)                         |
| Tests  | Vitest + Supertest (server), Vitest + Testing Library/jsdom (client)                       |
| Deploy | Static client (GitHub Pages) + API (Render); nothing has been deployed from this workspace |

Monorepo: `client/`, `server/`, `scripts/`, `docs/`, npm workspaces at the root.

## 2. Completed functionality

### Public website

- Routes: `/`, `/about`, `/treatments`, `/treatments/:slug`, `/gallery`,
  `/testimonials`, `/team`, `/contact`, `/faqs`, `/book`, `/privacy-policy`,
  `/terms`, `/medical-disclaimer`, 404.
- Every content surface is API-driven (`/api/public/*`); no clinic facts, prices,
  credentials or testimonials are invented. Unconfigured contact details are hidden.
- Treatment listing with server-side search/category filter, pagination and
  previous-data pagination state; detail pages with related services.
- Booking flow: form → validated `POST /api/appointments` → persisted as
  `pending` → server-built `wa.me` handoff from central settings. WhatsApp is
  never described as sent automatically and never confirms an appointment.
- Contact, enquiry and testimonial submission forms with honeypot, submit-timing
  check, consent requirement and per-route rate limits.
- Homepage hero copy, hero image, CTA, introduction and the featured/gallery/FAQ
  section visibility are read from admin settings with designed fallbacks.
- Floating WhatsApp button is settings-driven and hides when WhatsApp is
  disabled, unconfigured, or the toggle is off.

### Admin dashboard

- JWT session (HS256, 15 min) backed by a persisted session row; revocation,
  password-change invalidation, login throttling and superadmin role guard.
- Overview with live counts, inbox summary and pending badge.
- Inbox: appointments, enquiries, contact messages, testimonial submissions with
  search, status filters, from/to date filters, pagination, detail views, internal
  notes, status history, WhatsApp handoff and consent-gated testimonial moderation.
- Appointment status transitions validated server-side; `statusHistory` appended;
  no automatic confirmation.
- CRUD for services, categories, gallery, team, testimonials and FAQs (archive
  delete, publish/unpublish via `publishedAt`).
- Category usage counts computed with one aggregation across every service, and
  archiving is blocked while services still reference the category.
- Service and category ordering endpoints (`PATCH /api/admin/services/reorder`,
  `PATCH /api/admin/categories/reorder`), with list ordering applied.
- Website settings: identity, contact, hours, social, WhatsApp/booking, CTA labels,
  default SEO, legal date, plus the homepage block and visibility toggles.
- Admin account page (`/admin/account`) with current-password verification; the
  change revokes every session and requires a fresh sign-in.
- Services editor covers price, duration, SEO title/description, related service
  slugs, image (upload + alt text) and every previously supported field; blank
  optional fields are sent as `null`/`[]` so nothing is invented publicly.
- Admin media uploader (`client/src/admin/components/MediaUploadField.tsx`) wired
  into the gallery, team and service editors: type/size validation before upload,
  XHR progress, preview, error surface, replace, delete-with-confirmation and
  stored Cloudinary public IDs. Manual public-ID entry is kept as an escape hatch
  for assets uploaded outside the dashboard.
- Media endpoints: `POST /api/admin/uploads` (single image, magic-byte check,
  5 MB limit, server-generated filename, folder isolation) and
  `DELETE /api/admin/uploads` (refuses public IDs outside the project folder).
- Admin audit log: append-only collection recorded by middleware on every
  mutating `/admin` request plus explicit login-success, login-failure, logout and
  password-change entries. Stores actor, action, method, path, status, entity and
  request ID only — never bodies, credentials, tokens or customer messages. Read
  via `GET /api/admin/audit` (paginated, filterable by action, admin-auth + role
  guarded, 1-year TTL).

### Security

Helmet, strict CORS allowlist, compression, JSON/urlencoded body limits, global
API rate limit, per-route write limits, login lockout, Argon2id hashing, JWT
algorithm/issuer/audience verification, session-store revocation, Zod `.strict()`
validation at every write boundary, Mongoose `sanitizeFilter`, pino redaction of
auth headers, generic error envelopes with request IDs, and startup environment
validation that rejects insecure production values.

## 3. Incomplete or partial

| Item                                            | State                                              | Notes                                                                                                                                                                                                                           |
| ----------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Media upload UI                                 | Complete                                           | Gallery, team and service editors upload, preview, replace and delete through the admin media endpoints. Real Cloudinary calls stay unexercised here (no credentials); the error path is covered.                               |
| Service media/price/duration/SEO/related fields | Complete                                           | Exposed in the editor and round-tripped through the API; `order` still changes only through the reorder endpoint (no drag-and-drop UI).                                                                                         |
| Category publish flag                           | Model + schema complete                            | `isPublished` defaults to `true`; public queries do not yet filter on it. Ordering is applied.                                                                                                                                  |
| Homepage visibility                             | Complete for existing sections                     | Featured, gallery and FAQ toggles are honoured end to end. The three keys that no component read (`footerNote`, `showTeam`, `showTestimonials`) were removed from model, validation, public projection, client schema and form. |
| Sitemap / robots / metadata shells              | Build-time generation implemented                  | `scripts/generate-seo.mjs` writes `robots.txt`, `sitemap.xml`, a metadata shell per public route (`about/index.html`, …) and `404.html`. Treatment shells are written only when the build machine can reach the public API.     |
| Prerendering for SEO                            | Not implemented (documented)                       | Body prerendering is not feasible without restructuring the client (see §3.1). Per-route `<title>`/description/canonical/OG shells are generated instead.                                                                       |
| Browser QA                                      | Performed manually with the local Chromium preview | Login, settings save, account password change, service editing, booking submission, inbox status change and mobile navigation were exercised against a temporary in-memory harness. Media upload could not reach Cloudinary.    |
| Admin user management                           | Not implemented                                    | Single-owner model; role enum contains `superadmin` only.                                                                                                                                                                       |
| Audit log                                       | Complete (API only)                                | Collection, middleware, explicit auth events and `GET /api/admin/audit`. No dashboard screen reads it yet.                                                                                                                      |

### 3.1 Why the client is not prerendered

Prerendering the public routes would require a build-time renderer that can
replay the app's data layer: routes are client-only (`BrowserRouter`), every page
fetches through TanStack Query against a live API, and `<head>` values are applied
by runtime effects rather than declared per route. Rendering them statically would
mean either a headless browser pass at build time against a running API or moving
the app to a framework with route-level data loading — both restructure working
modules. The build therefore emits metadata shells: correct `<title>`,
description, canonical and Open Graph tags per public route, plus sitemap, robots
and the `404.html` deep-link fallback. Crawlers that execute JavaScript get the
full page; those that do not get correct metadata but an empty body. Sitemap
generation alone is not prerendering and is not claimed as such.

## 4. Known defects and risks

1. **Declared dependencies were incomplete.** `compression`, `cors`, `helmet`,
   `pino` and `pino-http` were imported by `server/src/app.ts` but not declared in
   `server/package.json`. They are now declared with exact versions.
2. **`npm audit` reports advisories.** `npm audit` output includes advisories in the
   current dependency tree. No forced upgrades were applied; review before launch.
3. **Cross-origin admin sessions.** A `*.github.io` client with an
   `*.onrender.com` API is cross-site; the refresh-cookie architecture in the plan
   is not implemented, so the current in-memory token with a fixed 60-minute TTL is
   the effective limitation. Same-registrable-domain hosting avoids the issue.
4. **Repository has no commits.** `git log` fails with "does not have any commits
   yet"; every path is untracked, so Git cannot report created-vs-modified files.
5. **Static-host SEO.** Page bodies are client-rendered. Crawlers that do not
   execute JavaScript receive the correct per-route metadata shell but no body
   content (see §3.1).
6. **Client suite timing.** Suites render the whole route tree in jsdom; on a
   loaded machine a first paint can exceed Testing Library's 1 s default. The
   suite now waits up to 5 s for async queries (`src/test/setup.ts`). Assertions
   are unchanged.

## 5. External dependencies

| Dependency                             | Needed for                                                                                          | Status                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| MongoDB Atlas cluster + user           | Production data                                                                                     | Not configured in this workspace                                                |
| Cloudinary cloud + API key/secret      | Image uploads                                                                                       | Not configured; the uploader surfaces the API's `503 MEDIA_UNAVAILABLE` message |
| Render service (or equivalent)         | API hosting                                                                                         | Not created                                                                     |
| GitHub Pages repository/settings       | Client hosting                                                                                      | Not configured                                                                  |
| Domain and DNS                         | Canonical URLs, cookies, SEO                                                                        | Not supplied                                                                    |
| Approved clinic content                | Phone, WhatsApp number, address, hours, team credentials, photography, treatment copy, legal review | Not supplied                                                                    |
| `JWT_SECRET`, `ADMIN_BOOTSTRAP_SECRET` | Production auth                                                                                     | Generated per environment by the operator                                       |

## 6. Planned work per remaining phase

| Phase                 | Scope                                                            | Status                                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8 — Testing & QA      | Extend server/client suites, browser E2E, axe, responsive checks | Suites extended (server 16 files / 134 tests, client 17 files / 85 tests); browser flows exercised manually; axe still not installed                     |
| 9 — SEO & performance | Metadata, sitemap, robots, prerender, image delivery             | Metadata shells + sitemap/robots/404 done; body prerendering rejected with a documented reason; image CDN transformations still pending real photography |
| 10 — Launch           | Deployment, domain, final content approval                       | Not started; requires client approval and credentials                                                                                                    |

## 7. Verification snapshot

Both workspaces pass all five gates (`format:check`, `typecheck`, `lint`, `test`,
`build`). Exact counts are recorded in `docs/test-report.md`.
