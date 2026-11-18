# Blue Miror — Implementation Plan & Architecture

> **Current status:** Phases 1–7 complete — discovery and branding, monorepo foundation, public website, MongoDB models, authentication, admin CRUD, booking persistence, WhatsApp handoff and the admin inbox. Phase 8 (testing/QA) is largely complete for server and unit-level client tests; browser/axe QA is outstanding. Phase 9 partial: metadata, build-time sitemap and robots exist, prerendering does not. See `docs/PROJECT-COMPLETION-STATUS.md` for the live implementation status and `docs/test-report.md` for verification results. No deployment has been attempted.
>
> **Gate:** production deployment happens only after explicit client approval (Phase 10).

---

## 1. Objective and non-negotiables

Build a new, independent, production-ready website and secure admin system for **Blue Miror**, an aesthetic clinic. The experience must feel premium and editorial while remaining calm, clear and trustworthy.

Non-negotiables:

1. Real backend functionality. No mocked admin dashboard, no dead buttons, no forms that only pretend to submit.
2. MongoDB Atlas, Cloudinary, Express/TypeScript and React/Vite exactly as specified.
3. No invented clinic information: no addresses, phone numbers, credentials, prices, statistics, certifications, treatment outcomes or testimonials.
4. All medical/aesthetic copy is editable, attributable and marked for clinic review before publication.
5. Appointment requests are never described as confirmed until an admin confirms them.
6. Production deployment only after explicit approval.
7. Every phase ends with a verification pass; a later phase never papers over a failing earlier one.
8. **Service-based only.** No products, cart, checkout, payments or e-commerce functionality.
9. **WhatsApp is the primary booking channel.** The country code, number, default booking message, message template and booking CTA labels are administered centrally. Every booking request is persisted in MongoDB before the customer is redirected to WhatsApp. Opening WhatsApp never confirms an appointment; only an explicit admin action changes the status.
10. Every public treatment page is loaded dynamically from the admin-managed services collection.

### Placeholder policy

- The UI may use **clearly labelled development placeholders** while real content is pending.
- Phase 3 uses a temporary read-only public content contract in `server/src/content/public-content.ts`; every record is marked `isDemo` or `isPlaceholder`.
- Phase 4 replaces that contract with a development seed guarded by `NODE_ENV !== 'production'` and a `SEED_DEMO_DATA` flag; each seeded record carries `isDemo: true`.
- Production seed creates only the minimum required settings shell and the first admin bootstrap path. No fake testimonials, appointments or clinic facts.
- Public components hide unconfigured data (phone, WhatsApp, map, social links) rather than showing invented values.
- Placeholder imagery is rendered as branded, clearly labelled visual placeholders; final licensed clinic photography replaces it before launch.

---

## 2. Information architecture

### Public routes

| Route                 | Page                | Key content                                                                                                                                                            |
| --------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                   | Home                | Hero, introduction, featured treatments, about, differentiators, benefits, gallery preview, team, testimonials, FAQs, contact/visit, footer                            |
| `/about`              | About Blue Miror    | Clinic story (editable), mission/vision, philosophy, space, team preview                                                                                               |
| `/treatments`         | Treatments          | Category filter, search, published treatment cards, enquiry CTA                                                                                                        |
| `/treatments/:slug`   | Treatment detail    | Overview, procedure, potential benefits, suitability, precautions, FAQs, related treatments, booking CTA and service-specific WhatsApp enquiry generated from settings |
| `/gallery`            | Gallery             | Category filter, accessible lightbox, optional consented before/after sets                                                                                             |
| `/testimonials`       | Testimonials        | Published, verified testimonials; moderated submission form (submission later phase)                                                                                   |
| `/team`               | Team                | Verified practitioner profiles only; credentials-first empty state in the current preview                                                                              |
| `/contact`            | Contact             | Address, phone, WhatsApp primary CTA, email, hours, map; contact form arrives with the backend endpoints                                                               |
| `/book`               | Book an appointment | Phase 3 explains the WhatsApp-first flow; Phase 5 adds the enquiry form, persistence and pending-confirmation state                                                    |
| `/faqs`               | FAQs                | Published FAQ list grouped by category, booking CTA                                                                                                                    |
| `/privacy-policy`     | Privacy Policy      | Drafted template for legal review                                                                                                                                      |
| `/terms`              | Terms & Conditions  | Drafted template for legal review                                                                                                                                      |
| `/medical-disclaimer` | Medical Disclaimer  | Drafted template for clinic/legal review                                                                                                                               |
| `*`                   | 404                 | Helpful navigation; `noindex`                                                                                                                                          |

**Phase 3 implementation note:** all public routes are implemented with a temporary read-only content API. The booking form, contact form, testimonial submission and live WhatsApp handoff are intentionally deferred until their persistence, validation and admin endpoints exist. Placeholder records are visibly marked; no clinic facts, prices, testimonials or credentials are invented.

### Admin routes (lazy-loaded)

| Route                                             | Screen                                                                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin/login`                                    | Sign in (no registration link)                                                                                                               |
| `/admin`                                          | Overview: real counts, recent appointments and enquiries                                                                                     |
| `/admin/appointments`                             | List, search, filters, detail drawer, status/reschedule/notes                                                                                |
| `/admin/enquiries`                                | Treatment enquiries, status and notes                                                                                                        |
| `/admin/contact-submissions`                      | General contact form submissions                                                                                                             |
| `/admin/services`                                 | Service list, publish state, order                                                                                                           |
| `/admin/services/new`, `/admin/services/:id/edit` | Service editor, image, category, FAQs, SEO                                                                                                   |
| `/admin/categories`                               | Service/gallery categories CRUD                                                                                                              |
| `/admin/gallery`                                  | Upload, caption, categorise, reorder, publish/delete                                                                                         |
| `/admin/testimonials`                             | Moderate submitted reviews; add, edit, publish, delete                                                                                       |
| `/admin/team`                                     | Team members, credentials (only verified data), photos                                                                                       |
| `/admin/faqs`                                     | FAQ CRUD and ordering                                                                                                                        |
| `/admin/settings`                                 | Business/contact, hours, social, map, hero, footer, WhatsApp booking configuration and CTA labels, booking slots, SEO defaults, logo/favicon |
| `/admin/audit-logs`                               | Read-only activity history with filters                                                                                                      |
| `/admin/account`                                  | Profile and password change                                                                                                                  |
| `/admin/*` (unknown)                              | Admin 404 inside the protected shell                                                                                                         |

### Global navigation

Desktop: logo, `About`, `Treatments`, `Gallery`, `Team`, `Contact`, primary CTA `Book a consultation`. Testimonials, FAQs, booking, legal and social links live in the footer; all routes remain reachable on mobile via an accessible navigation disclosure.

### Homepage section order

1. Announcement bar (optional, settings-driven; dismissible, not used for fake offers)
2. Header
3. Hero — editorial split layout, one strong portrait/interior image, headline, supporting copy, admin-configured primary booking CTA (WhatsApp-first) + `Explore treatments`
4. Brand introduction / manifesto
5. Featured treatments (published + featured only)
6. About the clinic with image and credentials-neutral copy
7. Why Blue Miror — 3–4 verified differentiators only
8. Treatment benefits / editorial information band
9. Gallery preview (published images only)
10. Team preview (published, verified members only)
11. Testimonials (approved + published only; hidden if none)
12. FAQ preview
13. Contact / visit band with map facade
14. Instagram/social links (only configured URLs)
15. Footer
16. Floating WhatsApp button using the centrally configured number/message (hidden until a verified number is configured)

No statistics, ratings, “years of experience”, “happy clients” counters or badges unless supplied and verified.

---

## 3. Page and component plan

### Public pages

- **Home:** data from `/api/public/settings`, `/api/services?featured=true`, `/api/gallery?limit=6`, `/api/team`, `/api/testimonials?limit=3`, `/api/faqs?limit=6`. All sections tolerate empty/absent data with designed empty or hidden states.
- **About:** settings-driven story/mission/philosophy; team grid; clinic images. Long-form fields support plain text paragraphs only (no raw HTML).
- **Treatments:** server-side category filter, text search and pagination; URL-synced filters; skeleton grid; graceful empty state.
- **Treatment detail:** slug lookup; `pending clinic review` notice is **not** shown publicly once content is approved — instead, all copy is flagged in admin until reviewed. Benefits worded as “may include”; suitability/precautions always present when supplied; related services; sticky booking card on desktop.
- **Gallery:** category chips, masonry-like CSS grid with fixed aspect ratios (no layout shift), accessible dialog lightbox with focus trap, keyboard arrows and captions. Before/after only when the pair has `consentConfirmed` and both images are published.
- **Testimonials:** approved/published only; optional “Share your experience” form posts to moderation, never directly live.
- **Contact:** contact details from settings; WhatsApp deep link; map iframe loaded only after user action (privacy + performance) or a static map link; contact form with honeypot and consent.
- **Book:** fullName, phone, optional email, treatment, preferred date, preferred time slot, message, consent. Clear copy: _“This is an appointment request. The clinic will contact you to confirm.”_ No slot locking or confirmation claims.
- **FAQs:** accordion, accessible headings/buttons, categories.
- **Legal:** long-form, typography-first layout with last-updated date and table of contents.
- **404:** editorial, links to treatments/contact.

### Shared components

`Header`, `MobileNav`, `Footer`, `WhatsAppFab`, `SkipLink`, `PageHero`, `SectionHeading`, `Eyebrow`, `Button`, `LinkArrow`, `ServiceCard`, `CategoryChips`, `TreatmentMeta`, `Accordion`, `TestimonialCard`, `TeamCard`, `GalleryGrid`, `Lightbox`, `MapFacade`, `ContactBlock`, `AppointmentForm`, `ContactForm`, `TestimonialForm`, `Newsletter` (only if requested later — not planned), `Breadcrumbs`, `SEO`, `JsonLd`, `Skeleton*`, `EmptyState`, `ErrorState`, `Pagination`, `ToastRegion`, `Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `FormErrorSummary`, `Modal`, `ConfirmDialog`, `StatusPill`, `DataTable`, `ImageUploader`, `CloudinaryImage`, `AdminPageHeader`, `FilterBar`, `SearchInput`, `Drawer`, `Tabs`, `ProtectedRoute`, `AuthProvider`, `QueryProvider`.

### Admin UX principles

- Real data only; every statistic is a count query.
- Destructive actions require a confirmation dialog naming the item; deletes are audited.
- Forms use RHF + Zod with server-side errors mapped back to fields.
- Dirty-form guard on navigation.
- Lists: debounced search, filters, sort, pagination (default 20, max 100), loading skeletons and empty states.
- Mobile: collapsible sidebar; tables become labelled cards; modals become full-height sheets.
- Image uploads show progress, validation and preview; deletion requires confirmation and removes the Cloudinary asset.
- Accessibility: visible labels, keyboard-operable menus, focus management, no icon-only controls without accessible names.

---

## 4. Technical stack and decisions

### Frontend

| Concern       | Decision                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Runtime/build | React 18.3 + Vite + TypeScript (strict), Node 22 for tooling                                                                |
| Routing       | React Router DOM v6, `BrowserRouter`; routes lazy-loaded                                                                    |
| Styling       | Tailwind CSS v4 via `@tailwindcss/vite`; brand tokens in `@theme`; small set of reusable primitives                         |
| Head/SEO      | `react-helmet-async` with a single `<SEO>` component and safe JSON-LD helper                                                |
| Forms         | React Hook Form + Zod (`@hookform/resolvers`)                                                                               |
| Data          | Central typed `fetch` client; TanStack Query for caching, deduplication, retries only where safe, and mutation invalidation |
| Animation     | Framer Motion, restricted to reveals/hover/dialog transitions; reduced-motion respected                                     |
| Icons         | Lucide React                                                                                                                |
| Fonts         | Fontsource self-hosted: Cormorant Garamond + Jost                                                                           |
| Upload UI     | Authenticated multipart upload to our API; progress via `XMLHttpRequest`/fetch wrapper                                      |
| Testing       | Vitest + React Testing Library; Playwright for smoke/E2E and axe checks                                                     |

**Why TanStack Query:** it solves duplicate requests, cache invalidation after admin mutations and request cancellation without bespoke code. It is a supporting library, not a replacement for the specified stack.

### Backend

| Concern    | Decision                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime    | Node.js 22 LTS                                                                                                                                  |
| Framework  | Express 5 + TypeScript, strict                                                                                                                  |
| Database   | MongoDB Atlas + Mongoose 8                                                                                                                      |
| Validation | Zod 4 at every trust boundary; `.strict()` bodies; explicit query/params schemas                                                                |
| Auth       | JWT access token (HS256, 15 min, explicit `algorithms`) + rotating opaque refresh token in an httpOnly cookie, hashed at rest in `AdminSession` |
| Passwords  | `bcrypt` cost 12; min 12 chars; blocklist of common/compromised patterns; no password reuse check required in v1                                |
| Uploads    | Multer memory storage (5 MB) → magic-byte check (`file-type`) → Cloudinary `upload_stream` under `blue-miror/...`                               |
| Security   | Helmet, strict CORS allowlist, rate limits, body limits, origin checks, sanitised errors                                                        |
| Logging    | Pino structured logs + request IDs; redaction of auth headers/cookies; Mongoose debug off in production                                         |
| Email      | Provider adapter selected in Phase 4 after service research; submission always persists first, notifications are best-effort                    |
| API style  | `/api` JSON REST, consistent envelope, cursor-free page pagination                                                                              |

### Monorepo shape

```text
blue-miror/
  client/
    public/
    src/
      assets/
      components/{ui,layout,home,forms,seo,admin}/
      layouts/
      pages/
      admin/{pages,components,context,hooks}/
      hooks/
      services/            # typed API modules
      lib/                 # fetch client, query client, validation, formatters
      context/
      utils/
      types/
      styles/
    index.html
    vite.config.ts
    tsconfig.json
    .env.example
  server/
    src/
      config/{env,database,cloudinary}.ts
      models/
      controllers/
      routes/
      middleware/
      services/{auth,media,mail,audit}.service.ts
      utils/
      types/
      app.ts
      server.ts
    test/
    tsconfig.json
    .env.example
    package.json
  scripts/
    prerender.mjs
    generate-sitemap.mjs
    create-admin.ts
  docs/
  .github/workflows/deploy-client.yml
  render.yaml
  package.json             # npm workspaces + root scripts
  .gitignore
  README.md
```

Client and server each have their own `package.json`, `tsconfig.json` and environment file; root scripts orchestrate but never hide their independent builds.

### Runtime flows

1. **Public page load:** fetch settings + page data → render with skeletons → cache public queries (5 min stale time). Settings fetched once per session and shared.
2. **Appointment (WhatsApp-first):** client form validation → `POST /api/appointments` → Zod server validation → duplicate window check → Mongoose insert with status `pending` → server builds a `wa.me` link from admin-configured WhatsApp settings with a prefilled, URL-encoded message → admin email best-effort → `201` with reference, “pending confirmation” wording and the generated WhatsApp URL. The client opens WhatsApp only after the request is stored. No status changes from opening WhatsApp.
3. **Admin login:** credentials → lockout/rate checks → bcrypt compare → session + refresh cookie → access token in memory → `/auth/me` → dashboard queries. Silent refresh on app reload.
4. **Admin mutation:** bearer token → auth middleware loads admin and verifies `tokenVersion`/active status → role check → Zod → controller → model → audit log (sanitised) → response → client invalidates relevant query keys.
5. **Image upload:** admin selects file → client-side type/size pre-check → authenticated multipart → server magic-byte validation → Cloudinary upload → media metadata saved on the entity → old asset optionally deleted after successful save (never before).

---

## 5. Database design

All schemas use `timestamps`, strict field types, trimmed strings, sensible max lengths, explicit `toJSON` projections and indexes for query paths. Passwords and token hashes are `select: false`.

| Collection           | Purpose                    | Key fields                                                                                                                                                                                                                                            | Indexes / rules                                                                                     |
| -------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `admins`             | Admin accounts             | name, email (lowercase, unique), passwordHash, role (`owner`, `editor`), tokenVersion, isActive, failedLoginAttempts, lockedUntil, lastLoginAt, passwordChangedAt                                                                                     | unique email; never return hash                                                                     |
| `adminsessions`      | Refresh sessions           | adminId, tokenHash, expiresAt, revokedAt, userAgent, ipHash, createdAt                                                                                                                                                                                | TTL on expiresAt; index adminId+revokedAt                                                           |
| `categories`         | Service/gallery categories | name, slug, type (`service`/`gallery`), description, order, isPublished                                                                                                                                                                               | unique `{type, slug}`; order                                                                        |
| `services`           | Treatments                 | name, slug, previousSlugs, category, shortDescription, description, procedure[], benefits[], suitability[], precautions[], faqs[], image (Media), order, isPublished, isFeatured, seo{}, createdBy                                                    | unique slug; `{isPublished, order}`; `{category, isPublished}`; text index on name/shortDescription |
| `appointments`       | Appointment requests       | bookingRef, fullName, phone, email?, serviceId?, serviceName snapshot, preferredDate (YYYY-MM-DD), preferredTime, message, status (`pending`,`confirmed`,`rescheduled`,`completed`,`cancelled`), adminNotes, statusHistory[], source, consentAccepted | unique bookingRef; `{status, preferredDate}`; `{phone, createdAt}`; `{preferredDate}`               |
| `enquiries`          | Treatment enquiries        | name, phone, email?, serviceId?, serviceName, message, status (`new`,`contacted`,`closed`), adminNotes, source                                                                                                                                        | `{status, createdAt}`; `{serviceId}`                                                                |
| `contactsubmissions` | General contact form       | name, email, phone?, subject, message, status (`new`,`in_progress`,`closed`), adminNotes                                                                                                                                                              | `{status, createdAt}`                                                                               |
| `testimonials`       | Reviews                    | name/initials, treatment, quote, rating?, consentConfirmed, status (`pending`,`approved`,`rejected`), isPublished, order, submittedByAdmin                                                                                                            | `{status, isPublished, order}`                                                                      |
| `gallery`            | Images                     | title, caption, category, image (Media), isBeforeAfter, beforeImage?, afterImage?, consentConfirmed, order, isPublished                                                                                                                               | `{isPublished, order}`; `{category, isPublished}`                                                   |
| `teammembers`        | Team                       | name, designation, qualifications[] (verified flag), bio, photo (Media), order, isPublished                                                                                                                                                           | `{isPublished, order}`                                                                              |
| `faqs`               | FAQs                       | question, answer, category, order, isPublished                                                                                                                                                                                                        | `{isPublished, order}`                                                                              |
| `settings`           | Singleton website settings | business, contact, hours[], social, map, hero, about, footer, booking, SEO defaults, brand assets                                                                                                                                                     | singleton key `site` unique                                                                         |
| `auditlogs`          | Admin activity             | actorId, actorEmail snapshot, action, entityType, entityId, summary, metadata (redacted), ipHash, userAgent, createdAt                                                                                                                                | `{createdAt}`; `{entityType, entityId}`; `{actorId, createdAt}`                                     |

**Media subdocument:** `{ url, secureUrl, publicId, alt, width, height, format, bytes, folder }`. Only server-generated Cloudinary values are accepted; clients never submit arbitrary image URLs.

**Settings shape (whitelisted for public read):**

- Business: display name, legal name (admin only if needed), tagline, logo, logoLight?, favicon.
- Contact: phone, email, address, Google Maps embed URL, directions URL.
- WhatsApp (admin-controlled): enabled flag, country code, number (digits), display number, default chat message, booking message template (whitelisted placeholders such as `{reference}`, `{name}`, `{service}`, `{date}`, `{time}`), primary booking CTA label, floating-button label and service-enquiry label.
- Booking: primary channel (`whatsapp`), timezone, allowed time slots, minimum notice days, maximum advance days, notification inbox. No booking is marked confirmed automatically.
- Hours: array of `{ days, opens, closes, closed }` or `{ label, value }`.
- Social: Instagram, Facebook, TikTok, YouTube (URLs validated as https).
- Hero: eyebrow, heading, supporting text, image, primary/secondary CTA labels and targets. Booking CTA labels come from the WhatsApp/booking settings so the admin can change them centrally.
- About: heading, body paragraphs, image.
- Footer: short blurb, legal links.
- Booking: timezone, allowed time slots, minimum notice days, maximum advance days, notification inbox.
- SEO defaults: title template, default description, default OG image, canonical base URL, social handle.
- No secrets ever live in settings.

**Data integrity rules**

- Service renaming updates the slug only on explicit admin action; old slugs are retained in `previousSlugs` so public lookups can redirect to the canonical slug.
- Appointments snapshot the service name so history survives service deletion.
- Deleting content is audited. Services/team/testimonials/gallery/FAQs may be hard-deleted after confirmation; appointments and audit logs are never deleted from the UI.
- A gallery before/after pair cannot be published unless `consentConfirmed === true` and both images exist.
- Settings updates are validated against a strict schema; unknown keys are rejected.

---

## 6. API design

### Conventions

Success:

```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields.",
    "fields": {}
  },
  "requestId": "..."
}
```

- Status codes: 200, 201, 204, 400, 401, 403, 404, 409, 413, 422, 429, 500, 503.
- Pagination: `page` (default 1), `limit` (default 20, max 100), deterministic sort with a tiebreaker.
- Every response carries `X-Request-Id`; logs correlate to it.
- Public projections only. Admin-only fields (notes, emails where not needed, internal IDs) never leak through public endpoints.
- No `PUT` for partial updates; `PATCH` for resources, `PUT` only for the singleton settings document.

### Public endpoints

> **Phase 3:** the currently implemented read-only paths are `/api/public/settings`, `/api/public/services`, `/api/public/services/:slug`, `/api/public/gallery`, `/api/public/testimonials`, `/api/public/team` and `/api/public/faqs`. The table below describes the target API after the MongoDB/admin phases. `/api/public/*` will be backed by published MongoDB records instead of the Phase 3 demo contract; no public write is implemented yet.

| Method & path                                      | Purpose                                  | Notes                                                                                                                                        |
| -------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`                                  | Health/readiness                         | Generic status only; 503 if DB unavailable                                                                                                   |
| `GET /api/public/settings`                         | Branding/contact/hero/footer/booking/SEO | Strict whitelist; cacheable                                                                                                                  |
| `GET /api/categories?type=service\|gallery`        | Published categories                     |                                                                                                                                              |
| `GET /api/services?page&limit&q&category&featured` | Published services                       | Server-side search/filter                                                                                                                    |
| `GET /api/services/:slug`                          | Service detail                           | Includes published embedded FAQs; 301-equivalent canonical info for old slugs                                                                |
| `GET /api/gallery?page&limit&category`             | Published gallery                        | Before/after only when consent-approved                                                                                                      |
| `GET /api/testimonials?page&limit`                 | Approved + published                     |                                                                                                                                              |
| `GET /api/team`                                    | Published team                           | Verified records only                                                                                                                        |
| `GET /api/faqs`                                    | Published FAQs                           | Grouped/sorted                                                                                                                               |
| `POST /api/appointments`                           | Appointment request                      | 5/hour/IP; duplicate window; persists as `pending`; returns reference plus a server-generated WhatsApp deep link when WhatsApp is configured |
| `POST /api/enquiries`                              | Treatment enquiry                        | 10/hour/IP                                                                                                                                   |
| `POST /api/contact`                                | Contact message                          | 5/hour/IP                                                                                                                                    |
| `POST /api/testimonials/submit`                    | Testimonial submission                   | 3/hour/IP; enters `pending`                                                                                                                  |

`GET /api/public/settings` includes the sanitised WhatsApp/booking configuration needed by public CTAs. The WhatsApp number is only exposed when the clinic has configured it; it is never invented.

Public writes use honeypot + submit-timing checks, strict validation, rate limits and length caps. No public write can set status, publish flags or ordering.

### WhatsApp booking flow

1. All WhatsApp CTAs read the public settings payload: enabled state, country code, number, default message, booking CTA label and template. No number is hardcoded in the client.
2. `/book` collects only the fields defined in Phase 3 and posts to `/api/appointments`.
3. The API validates, deduplicates and persists the request as `pending` before generating any redirect.
4. The API constructs `https://wa.me/<countryCode><number>?text=<encoded message>` using the admin template and the saved request values. The number is normalised to digits and the text is fully URL-encoded.
5. The client shows the pending confirmation and opens the WhatsApp link. Opening the link is a handoff, not a confirmation; the appointment remains `pending` until an admin changes it.
6. If WhatsApp is disabled or unconfigured, no WhatsApp CTA is rendered. The form can still persist an enquiry and show the pending state, with the request visible in the admin dashboard.
7. Service-specific enquiry buttons prefill the treatment name from the service record; the public service page itself always loads from the database.

No product, cart, checkout, payment or e-commerce route is part of the system.

### Authentication endpoints

| Method & path               | Purpose                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/bootstrap`  | One-time first-owner creation; requires `ADMIN_BOOTSTRAP_SECRET`; refuses once an admin exists; rate-limited; audited |
| `POST /api/auth/login`      | Email/password → access token + refresh cookie                                                                        |
| `POST /api/auth/refresh`    | Rotate refresh session → new access token                                                                             |
| `POST /api/auth/logout`     | Revoke current session, clear cookie                                                                                  |
| `GET /api/auth/me`          | Current admin profile                                                                                                 |
| `PATCH /api/auth/password`  | Current password + new password; revokes all sessions, increments `tokenVersion`                                      |
| `POST /api/auth/logout-all` | Revoke all refresh sessions (optional, admin account page)                                                            |

### Admin endpoints (all protected)

| Resource            | Endpoints                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard           | `GET /api/admin/dashboard` — counts and recent items                                                                                                                                          |
| Audit logs          | `GET /api/admin/audit-logs?page&limit&action&entityType&from&to`                                                                                                                              |
| Services            | `GET/POST /api/admin/services`, `GET/PATCH/DELETE /api/admin/services/:id`                                                                                                                    |
| Categories          | `GET/POST /api/admin/categories`, `PATCH/DELETE /api/admin/categories/:id`                                                                                                                    |
| Appointments        | `GET /api/admin/appointments` (search/filter/pagination), `GET/PATCH /api/admin/appointments/:id`, `PATCH /api/admin/appointments/:id/status`, `PATCH /api/admin/appointments/:id/reschedule` |
| Enquiries           | `GET /api/admin/enquiries`, `GET/PATCH /api/admin/enquiries/:id`                                                                                                                              |
| Contact submissions | `GET /api/admin/contact-submissions`, `GET/PATCH /api/admin/contact-submissions/:id`                                                                                                          |
| Testimonials        | `GET/POST /api/admin/testimonials`, `PATCH/DELETE /api/admin/testimonials/:id`, `PATCH /api/admin/testimonials/:id/status`                                                                    |
| Gallery             | `GET/POST /api/admin/gallery`, `PATCH/DELETE /api/admin/gallery/:id`, `PATCH /api/admin/gallery/reorder`                                                                                      |
| Team                | `GET/POST /api/admin/team`, `PATCH/DELETE /api/admin/team/:id`                                                                                                                                |
| FAQs                | `GET/POST /api/admin/faqs`, `PATCH/DELETE /api/admin/faqs/:id`, `PATCH /api/admin/faqs/reorder`                                                                                               |
| Settings            | `GET/PUT /api/admin/settings`                                                                                                                                                                 |
| Uploads             | `POST /api/admin/uploads` (multipart, one image), `DELETE /api/admin/uploads` (body: publicId)                                                                                                |

Appointment status transitions are validated server-side (`pending → confirmed|cancelled`, `confirmed → rescheduled|completed|cancelled`, `rescheduled → confirmed|completed|cancelled`). Every transition requires an audit entry; rescheduling records the previous and new date/time.

---

## 7. Authentication and session design

- **Access token:** JWT HS256, 15 minutes, claims `sub`, `role`, `ver`, `iss`, `aud`, `iat`, `exp`. Verify algorithm explicitly, issuer and audience.
- **Refresh token:** 32-byte random, sent only as `httpOnly; Secure; SameSite=Strict; Path=/api/auth` cookie; SHA-256 hash stored in `AdminSession`; 7-day expiry, rotated on refresh. Re-use of a revoked token revokes that session and is audited.
- **Storage:** access token lives in memory only; never localStorage. On reload, the app calls `/auth/refresh` to restore the session.
- **Revocation:** middleware loads the admin and compares `tokenVersion` + active state; password change revokes all sessions and increments the version. Logout revokes the current session.
- **Lockout:** 5 failures → 15-minute lock; failed attempts cleared on success; login responses are generic; unknown emails still incur a dummy bcrypt comparison to reduce timing differences.
- **Bootstrap:** only works when `admins` is empty. Secret compared with `timingSafeEqual`; endpoint rate-limited and disabled by returning `409` once an owner exists. Secret is never logged. After bootstrap, rotate/remove `ADMIN_BOOTSTRAP_SECRET`.
- **CSRF:** access token is a bearer header (not ambient); refresh/logout use SameSite=Strict cookies; Origin is checked against the allowlist on state-changing requests. No cookie-based authorization for admin APIs.
- **Cross-site deployment note:** if the frontend is on `*.github.io` and the API on `*.onrender.com`, browsers treat them as different sites, so the refresh cookie may be blocked. Recommended production layout is `www.<domain>` + `api.<domain>` (same registrable domain). If the client cannot provide that, fall back to a short-lived access-token-only session (30–60 min, re-login on expiry) and document the UX trade-off. This decision is recorded in the deployment guide after the domain is confirmed.

---

## 8. Media and Cloudinary

- Folder namespace: `blue-miror/branding`, `blue-miror/services`, `blue-miror/gallery`, `blue-miror/team`, `blue-miror/homepage`.
- Backend-mediated, authenticated uploads only. No unsigned upload preset exposed to the browser.
- Validate extension, declared MIME and magic bytes; allow JPEG, PNG, WebP. Reject SVG and GIF uploads (SVG can carry scripts; GIF is unnecessary). Max 5 MB.
- Deliver with `f_auto,q_auto:good` and width variants: 480, 768, 1024, 1440, 1920 where relevant; generate `srcset`/`sizes`; set width and height to prevent layout shift.
- Hero images load eagerly with `fetchpriority="high"` and a preload hint; everything else lazy-loads.
- Alt text required in admin for meaningful images; decorative images may use empty alt.
- Delete only through an authenticated endpoint, only for public IDs inside `blue-miror/`, and only after confirming the asset is no longer referenced by the entity being updated.
- Track Cloudinary asset metadata (publicId, dimensions, format) in MongoDB; never store binary image data.
- Free-tier limits and transformations are documented for the client.

---

## 9. Security architecture

### Environment and startup

Required variables validated by Zod at boot. In production: reject missing values, known placeholders (`change-me`, `secret`, `password`), `JWT_SECRET` shorter than 64 characters, and wildcard CORS. `MONGODB_URI` is never logged. `ADMIN_BOOTSTRAP_SECRET` is at least 32 characters. `.env` files are gitignored; `.env.example` contains placeholders only.

### HTTP controls

| Control     | Implementation                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Headers     | Helmet; `x-powered-by` disabled; HSTS in production; conservative CSP for API responses                                                          |
| CORS        | Exact origin allowlist from `CORS_ORIGINS`; credentials only for auth; reject unknown origins; no wildcard                                       |
| Rate limits | Global `/api` 300/15 min; login 10/15 min IP + account lockout; public writes 3–10/hour; uploads 30/hour/admin                                   |
| Body limits | JSON 100 KB; multipart 5 MB; Multer single-file field                                                                                            |
| Input       | Zod `.strict()`, trimming, max lengths, enum allowlists, phone/email/date validation, URL scheme validation                                      |
| Injection   | No raw query objects from clients; `mongoose.set('sanitizeFilter', true)`; reject keys starting with `$` or containing `.`; explicit projections |
| XSS         | No user HTML rendering; plain-text admin fields; safe escaped JSON-LD serializer; no `dangerouslySetInnerHTML` for user content                  |
| Errors      | Central handler; stack traces only in development; generic 500 with request ID in production                                                     |
| Logging     | Pino redacts `authorization`, `cookie`, `set-cookie`, password fields; no request bodies for auth/uploads                                        |
| Uploads     | Magic-byte + MIME + extension checks; dimensions sanity check; Cloudinary folder restriction; authenticated deletion                             |
| Admin       | No registration; protected routes and APIs; role checks; audit log; password change revokes sessions                                             |
| Secrets     | Server-only; public client env limited to API URL, site URL and Cloudinary cloud name                                                            |

### Audit logging

Record: bootstrap, login success/failure, logout, password change, create/update/delete for all content, appointment status/reschedule, settings changes, uploads/deletions. Never record passwords, tokens, cookies, secrets or full request bodies. Store actor snapshot, action, entity, summary, sanitised diff metadata, IP hash and user agent. Audit writes are fire-and-forget but errors are logged; they must never block the main operation silently without a server log.

### Security verification

Dedicated test suite covers: public access to admin endpoints (401), invalid/expired/wrong-signature JWT (401), alg confusion attempts (401), wrong password and lockout (429/423-style response with generic message), repeated login attempts, malformed JSON (400), oversized payload (413), invalid uploads (415/422), XSS payload storage/rendering (escaped), NoSQL operators in bodies/queries (400), invalid appointment forms (422), CORS preflight from unknown origin (blocked), and admin CRUD authorization. `npm audit` results are reviewed; no blind major upgrades.

---

## 10. SEO plan

- Per-page `<title>`, meta description, canonical, OG and Twitter tags via `<SEO>`.
- Canonical base from `VITE_SITE_URL`; never derived from request headers.
- `sitemap.xml` generated at build from static routes + published service slugs; `robots.txt` disallows `/admin` and points to the sitemap.
- **GitHub Pages reality:** a pure SPA returns 404 for deep links and exposes no per-page OG tags to social scrapers. The plan therefore adds a build-time prerender step (`scripts/prerender.mjs`) using Playwright: build → preview server → enumerate public routes from the API → render each route → write `dist/<route>/index.html` → generate sitemap. If an API is unreachable, the build fails for production rather than silently shipping unprerendered SEO pages. Content changes that need fresh crawler snapshots trigger a redeploy (nightly scheduled rebuild recommended).
- If prerendering proves unstable in Phase 9, the fallback is the GitHub Pages `404.html` SPA shell; this is documented as a reduced-SEO fallback and requires client sign-off.
- Structured data: `LocalBusiness`/`MedicalClinic` only with verified settings fields (address, phone, hours, geo); omit unknown properties. `Service` for published treatments, `FAQPage` only for visible FAQs, `BreadcrumbList` on nested pages. Safe JSON-LD serialization escapes `<`, `>` and `&`.
- No fake `aggregateRating`, awards, price ranges, credentials, or opening hours.
- Semantic landmarks, one `h1` per page, descriptive alt text, internal links between services/FAQ/booking, human-readable slugs.
- Admin pages: `noindex, nofollow`.
- Google Search Console / Business Profile verification tokens are added only when supplied.

---

## 11. Performance and accessibility

- Route-level code splitting; admin bundle loaded only under `/admin`.
- Public settings cached in the query client; no duplicate fetches on mount.
- Cloudinary responsive images with fixed aspect ratios; skeletons reserve space; fonts self-hosted with `font-display: swap` and preloaded weights only.
- Hero image preloaded; below-the-fold images lazy; map facade avoids loading a third-party iframe until clicked.
- Bundle budget checked at build; no icon library barrel imports (import individual Lucide icons).
- Motion respects `prefers-reduced-motion`; animations only transform/opacity.
- Target WCAG 2.2 AA: visible focus, skip link, keyboard-operable nav/menus/dialogs, labelled inputs, error announcements, logical heading order, 44 px touch targets, no colour-only status.
- Responsive checks at 360, 390, 768, 1024, 1280 and 1440 px, including admin tables/forms.

---

## 12. Testing and QA

| Layer               | Tooling                                    | Coverage                                                                                                                                   |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Type safety         | `tsc --noEmit` in both workspaces          | Strict mode, no skipped errors                                                                                                             |
| Lint/format         | ESLint + Prettier                          | Both workspaces                                                                                                                            |
| Backend integration | Vitest + Supertest + mongodb-memory-server | Auth, CRUD, public projections, validation, pagination, audit, uploads (Cloudinary mocked), rate limits, CORS                              |
| Security            | Vitest/API scripts                         | The matrix in §9                                                                                                                           |
| WhatsApp/booking    | Vitest/API + client tests                  | Persist-before-redirect, URL encoding, admin-configured settings, hidden CTA when unconfigured, and status remains `pending` after handoff |
| Frontend unit       | Vitest + RTL                               | Form validation, error mapping, protected routes, SEO helper, image URL builder                                                            |
| E2E smoke           | Playwright                                 | Home, treatments, booking, contact, admin login, each admin CRUD, image upload (dev Cloudinary), logout                                    |
| Accessibility       | axe + manual keyboard pass                 | Public pages and admin core flows                                                                                                          |
| Responsive          | Playwright viewports + manual              | Specified breakpoints                                                                                                                      |
| Production builds   | `npm run build` both                       | Outputs checked                                                                                                                            |
| Dependency health   | `npm audit --omit=dev`                     | High/critical investigated                                                                                                                 |

Deliverable: `docs/test-report.md` created in Phase 8 with pass/fail evidence, commands, limitations, and unresolved issues. A failing check is reported, not hidden.

---

## 13. Deployment plan (approval-gated)

### Frontend — GitHub Pages

- GitHub Actions: `npx --yes npm@11.21.2 ci`, typecheck, build, prerender, sitemap, upload artifact, deploy Pages (npm 11 is required).
- Public env: `VITE_API_BASE_URL`, `VITE_SITE_URL`, `VITE_CLOUDINARY_CLOUD_NAME`. No secrets.
- Custom domain + HTTPS configured only after the client supplies the domain; DNS records documented.
- `404.html` shell retained for admin deep links and unknown routes.
- Caching: hashed assets immutable; HTML no-cache via Pages defaults.

### Backend — Render

- Web Service, root `server`, build `npx --yes npm@11.21.2 ci && npm run build`, start `node dist/server.js`, health `/api/health` (npm 11 is required by the dependency tree).
- Env: all vars from §9; production CORS exact; `NODE_ENV=production`; Render `trust proxy`.
- **Free plan caveat:** services spin down after inactivity; first request can take 30–60 s. This is unacceptable for booking conversion and admin use at launch; recommend a paid instance. A scheduled ping is not a substitute for a real plan.
- Logs retained per Render plan; structured logs, no secrets.

### MongoDB Atlas

- Dedicated Blue Miror project, dedicated DB user with least privilege, strong generated password.
- Separate databases/URIs for development and production.
- Network access: Render free outbound IPs are not static, so a broad Atlas allowlist may be unavoidable on free plans; if production uses static egress, restrict to those IPs. Document the trade-off and use TLS.
- Index creation verified after deploy; Atlas M0 backup limitations documented with an export strategy.

### Cloudinary

- Dedicated cloud account, API credentials only in Render env, folders under `blue-miror/`.
- Upload validation tested with valid/invalid files; deletion restricted by folder prefix.

### Custom domain

- Not assumed. `www.<client-domain>` for the frontend, `api.<client-domain>` for the API; HTTPS, canonical URLs, CORS, cookies and DNS verified. Placeholders in docs use `<CLINIC_DOMAIN>`.

### Pre-deploy checklist (Phase 9)

- [ ] Production env values complete; no placeholders; JWT/bootstrap secrets strong.
- [ ] Atlas connection, indexes and CRUD verified.
- [ ] Cloudinary upload/delete verified.
- [ ] Admin bootstrap performed securely; test admin removed.
- [ ] CORS exact; cookies work on the chosen domain layout.
- [ ] Frontend build + prerender + sitemap generated.
- [ ] Health endpoint and API smoke tests pass.
- [ ] Legal/medical copy approved; all placeholder content removed.
- [ ] Real contact details, services, team, gallery and testimonials loaded and verified.
- [ ] No secrets in the repository or client bundle.
- [ ] Explicit client approval recorded before Phase 10.

**Phase 10 is not executed in this phase.**

---

## 14. Phase-by-phase build checklist

### Phase 1 — Discovery and planning ✅

- Logo inspected, palette sampled, type direction defined.
- Sitemap, component inventory, data model, API contract, security and deployment plans documented.
- Missing client information listed in [`03-client-information-checklist.md`](03-client-information-checklist.md).
- **Exit:** client approves brand direction and plan; logo assets/domain/content requests acknowledged.

### Phase 2 — Project setup ✅

- Initialize git repository; root workspaces; `.gitignore`; `.env.example` files; README.
- Scaffold client (Vite/React/TS/Tailwind) and server (Express/TS).
- Install pinned dependencies; ESLint/Prettier/tsconfig strict; env validation; health endpoint skeleton.
- **Exit met:** install, typecheck, lint, tests and independent builds pass; no secrets committed.

### Phase 3 — Frontend ✅

- Design tokens, typography, primitives, layouts, header/footer and settings-driven booking CTAs.
- All approved public pages: home, about, treatments, dynamic treatment detail, gallery, testimonials, team, contact, FAQs, booking information, legal templates and 404.
- API-driven services with search/category filters, loading, empty and error states; no hardcoded treatment catalogue.
- Placeholder data clearly marked; responsive behaviour; SEO component; no forms are presented as functional before their endpoints exist.
- **Exit met:** all routes reachable; no dead links; mobile navigation, accordion and filter interactions tested; typecheck, lint, 38 tests and both builds pass; responsive checks at 390 px and 1440 px.

### Phase 4 — Backend

### Phase 4 — Backend

- Models/indexes, env validation, Mongo connection, Cloudinary config.
- Auth (bootstrap/login/refresh/logout/me/password), audit service, uploads, public/admin routes, validation, error handling, rate limits, CORS.
- Development seed (demo data gated) + first-admin script/endpoint.
- **Exit:** integration tests pass; real Mongo CRUD verified; uploads verified; auth/security tests pass.

### Phase 5 — Admin dashboard

- Auth shell, protected routes, dashboard, services/categories, appointments, enquiries, contact submissions, gallery, testimonials, team, FAQs, settings, SEO fields, audit logs, account/password.
- Every control wired to the real dev API; no mock stats.
- **Exit:** each CRUD flow tested end-to-end; destructive actions confirmed; mobile usable; audit entries generated.

### Phase 6 — Integration

- Public site consumes live settings/data; appointments/contact/enquiries/testimonial submissions persist; image URLs render responsively; admin edits reflected publicly after cache invalidation.
- **Exit:** full user journeys pass against the development backend; no hardcoded content remains outside demo-guarded seed.

**Phase 6 implementation note:** public writes are implemented and persisted —
`POST /api/appointments`, `POST /api/enquiries`, `POST /api/contact` and
`POST /api/testimonials/submit` validate with Zod, require recorded consent, run honeypot and
submit-timing checks, and are rate limited per IP in production (5/10/5/3 per hour). An
appointment is always stored as `pending` with a generated `BM-YYMMDD-XXXX` reference and a server-
built WhatsApp deep link from the admin-configured template; it is never auto-confirmed. Public
forms are wired on `/book`, `/contact`, `/testimonials` and each treatment detail page. Public
queries use a 60-second stale time to match the API's `max-age=60` public cache.

Remaining gaps for this phase: Cloudinary media uploads (`image`/`photo` fields) are still not
exposed, so gallery and team records carry a `cloudId` without a public image URL; the admin UI
has no appointment/enquiry/contact inbox because no admin read/update endpoints exist yet.

### Phase 7 — Security

- Run the full security matrix; fix high/critical findings; review auth, CORS, validation, uploads, rate limits, env handling, logs, bundle secrecy.
- `npm audit`; document remaining advisories with rationale.
- **Exit:** no unresolved high/critical issues; security checklist documented.

**Phase 7 implementation note (admin inbox):** the submission records added in Phase 6 are now
readable and actionable through protected endpoints — `GET/PATCH /api/admin/appointments`,
`/api/admin/enquiries`, `/api/admin/contact-submissions`, `/api/admin/testimonial-submissions`
(with `:id` detail routes) plus `GET /api/admin/inbox/summary`. All of them sit behind the existing
`requireAdminAuth` + `requireAdminRole` guard. Listings support `page`, `limit`, `q`, `status` and
`from`/`to`, are sorted newest first and are projected without `ipHash`, `userAgent` or
`consentAccepted`. Appointment statuses are `pending` (WhatsApp pending), `contacted`, `confirmed`,
`rescheduled`, `completed`, `cancelled`; transitions are validated and each change appends to
`statusHistory` — a new request is never auto-confirmed. Testimonials can only be published when a
consent timestamp is stored, otherwise the API returns `409 CONSENT_REQUIRED`.

The dashboard gained `/admin/inbox` with four tabs, search, status filtering, pagination, detail
views, WhatsApp handoff built from the clinic's configured settings and testimonial moderation.
The overview now shows real pending counts, and the sidebar badge uses the same summary endpoint.

Also fixed in this phase: the category archive guard now counts every referencing service in the
database (grouped count for the list, `countDocuments` before archiving) instead of inspecting the
first 48 loaded services, and `cloudinary` plus `express-rate-limit` are declared in
`server/package.json` because both are imported directly by server source.

### Phase 8 — Testing and QA

- Typecheck, lint, builds, API tests, E2E, accessibility, responsive, security retest.
- Produce `docs/test-report.md` with evidence and limitations.
- **Exit:** all critical flows pass; failures either fixed or explicitly accepted by the client.

### Phase 9 — Deployment preparation

- Documentation: setup, deployment, security, API, admin guide, environment variables, production checklist.
- Verify production config, Atlas indexes, Cloudinary, CORS, admin bootstrap, prerender/sitemap, health.
- **Exit:** pre-deploy checklist complete; client approval requested.

### Phase 10 — Production deployment (explicit approval required)

- Deploy backend, verify health; deploy frontend, verify HTTPS/routing.
- Smoke test site, API, database writes, images, admin login, forms, mobile.
- **Exit:** final report (features, pending items, stack, collections, routes, security, tests, builds, deployment status, missing client info).

---

## 15. Risks and decisions

| Risk / decision                                          | Impact                            | Treatment                                                                                  |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| Logo vector, horizontal lockup and light variant missing | Header/footer polish, favicon     | Request assets; use supplied transparent PNG on light surfaces meanwhile; do not recolour  |
| Clinic services/team/testimonials not supplied           | Cannot launch real content        | Build with labelled demo data in development; no fake production content                   |
| Domain not confirmed                                     | Cookies, CORS, canonical/SEO, DNS | Use `<CLINIC_DOMAIN>` placeholders; decide auth layout once confirmed                      |
| GitHub Pages SPA limits                                  | Deep-link 404s, social OG         | Build-time prerender + sitemap; document fallback                                          |
| Render free spin-down                                    | Slow first load, lost bookings    | Recommend paid plan; document cold-start behaviour                                         |
| Atlas free-tier networking/backups                       | Security/DR trade-off             | Least-privilege user, TLS, documented allowlist; scheduled exports                         |
| Email notification provider not chosen                   | Admin alerts                      | Research provider in Phase 4; adapter + best-effort delivery; dashboard is source of truth |
| Cross-site cookies (`github.io` ↔ `onrender.com`)        | Admin session                     | Same-site custom subdomains preferred; access-token fallback documented                    |
| Medical/legal approval pending                           | Compliance                        | Content fields marked “awaiting clinic approval”; templates reviewed by clinic/legal       |
| Before/after consent                                     | Ethical/legal                     | Feature hidden until genuine consented assets exist                                        |
| Third-party embeds (maps/social)                         | Privacy/performance               | Click-to-load facade; no third-party tracking on initial load                              |

---

## 16. Definition of done

1. Both workspaces typecheck, lint and build cleanly.
2. Public site is fully responsive and uses live settings/data.
3. Every admin button performs a real, audited operation.
4. Appointments, enquiries, contact messages and moderated testimonials persist in MongoDB.
5. Cloudinary uploads validate, optimize, and delete safely.
6. Authentication, authorization, rate limits, CORS and upload protections pass the security matrix.
7. SEO metadata, sitemap, robots and structured data are generated with verified information only.
8. Test report, API docs, admin guide, setup, deployment, security and env documentation exist.
9. No placeholder clinic facts, fake reviews, credentials or statistics remain in production.
10. Production deployment occurs only after explicit client approval, followed by the final completion report.
