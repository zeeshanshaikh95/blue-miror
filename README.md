# Blue Miror

A premium public website and secure admin platform for **Blue Miror**, an aesthetic clinic.

> **Status: frontend preview deployed.** The public website, admin platform, API, authentication and booking persistence are implemented. The static frontend is live at <https://zeeshanshaikh95.github.io/blue-miror/> via GitHub Pages. The API and MongoDB are not hosted yet, so data-driven sections display their error states until `VITE_API_BASE_URL` points at a deployed API.

---

## Project documents

| Document                                                                | Purpose                                                                                                                                   |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [Public website notes](docs/04-public-site.md)                          | Phase 3 routes, temporary content API, placeholders, accessibility, verification and screenshots                                          |
| [Setup guide](docs/setup.md)                                            | Install, environment variables, local run, API checks, testing and troubleshooting                                                        |
| [Brand & design system](docs/01-brand-guidelines.md)                    | Logo analysis, sampled palette, typography, layout, components, imagery and logo rules                                                    |
| [Implementation plan](docs/02-implementation-plan.md)                   | Sitemap, page/component plan, stack decisions, database models, API surface, auth, security, SEO, testing, deployment and phase checklist |
| [Client information checklist](docs/03-client-information-checklist.md) | Missing clinic information, assets and approvals, with blocking status and placeholder policy                                             |
| [Logo reference](docs/assets/blue-miror-logo.png)                       | Unmodified copy of the supplied logo                                                                                                      |

---

## Quick start

Requirements: Node.js 22.12+ and **npm 11+**. npm 10 currently crashes on this dependency tree; use `npx --yes npm@11.21.2 install`.

```bash
npx --yes npm@11.21.2 install
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both .env files — see docs/setup.md for safe secret generation.
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000
- Health: http://localhost:4000/api/health

If your shell already exports `PORT=0`, run the API with `PORT=4000 npm run dev`; dotenv does not override existing environment variables.

The public site is a **development preview** with sample service records and clearly marked placeholders. It is `noindex` until clinic-approved content is supplied.

### Verification

```bash
npm run typecheck
npm run lint
npm run test
VITE_API_BASE_URL="https://api.<domain>/api" \
VITE_SITE_URL="https://www.<domain>" \
VITE_ALLOW_INDEXING="false" \
npm run build
```

Current coverage: 85 client tests across 17 files, plus the server suite. Run `npm run verify` for the full gate.

---

## Deployment

The public site is deployed to GitHub Pages by [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) on every push to `main`.

- Live URL: <https://zeeshanshaikh95.github.io/blue-miror/>
- The build runs with `VITE_BASE=/blue-miror/` so assets and client-side routes resolve under the project sub-path.
- Repository variables (Settings → Secrets and variables → Actions → Variables):
  - `VITE_API_BASE_URL` — deployed API URL including `/api`; without it the build defaults to `http://localhost:4000/api`.
  - `VITE_CLOUDINARY_CLOUD_NAME` — optional, for responsive image delivery.
- The Express API and MongoDB still need a host (for example Render + MongoDB Atlas). Set `VITE_API_BASE_URL` and re-run the workflow once they are live. Until then, API-driven sections show their normal error states.
- Indexing stays disabled (`VITE_ALLOW_INDEXING=false`) until clinic-approved content is supplied.

---

## Implemented public experience

- Editorial homepage with hero, approach, featured treatments, visual direction, FAQs and booking entry point
- API-driven treatment listing with search, category filters, URL-synced state and loading/empty/error states
- Dynamic treatment detail pages with drafted benefits, suitability, FAQs, related treatments and booking CTA
- About, Gallery, Testimonials, Team, Contact, FAQs, Booking, legal templates and 404 routes
- Responsive header with accessible mobile disclosure, footer and skip link
- Central settings-driven booking CTAs; no WhatsApp number is hardcoded
- Self-hosted Cormorant Garamond + Jost typography and the sampled Blue Miror palette
- Supplied logo preserved unmodified in `client/public/brand/`
- SEO metadata, canonical URLs, Open Graph/Twitter tags and a launch-gated robots policy
- No products, cart, checkout, inventory or payment features

### Temporary content contract

Phase 3 reads a read-only public API backed by clearly marked demo records:

```text
GET /api/public/settings
GET /api/public/services
GET /api/public/services/:slug
GET /api/public/gallery
GET /api/public/testimonials
GET /api/public/team
GET /api/public/faqs
```

The frontend has no hardcoded treatment catalogue. Phase 4 replaces the temporary contract with MongoDB models, admin CRUD and real public projections. See [docs/04-public-site.md](docs/04-public-site.md).

---

## Approved product constraints

- **Service-based only.** No products, cart, checkout, payments or e-commerce.
- **WhatsApp is the primary booking channel.** The WhatsApp number, country code, default booking message, booking templates and CTA labels are configured centrally in admin settings; nothing is hardcoded.
- **Persist, then redirect.** A booking enquiry will be saved to MongoDB before the customer is sent to WhatsApp with a prefilled message.
- **No false confirmation.** Opening WhatsApp never changes appointment status. Requests stay `pending` until an admin confirms them.
- **Dynamic services.** Every public treatment page reads from the admin-managed services database.
- **Real content only.** Business details, services, prices, credentials and testimonials remain verified placeholders until the clinic supplies them.
- **Logo integrity.** The supplied logo is preserved without modification and is not reused from another project.

---

## Stack

**Client:** React 18 + Vite + TypeScript + Tailwind CSS 4 + React Router + React Helmet Async + TanStack Query + Zod + Lucide React.

**Server:** Node.js 22 + Express 5 + TypeScript + MongoDB Atlas + Mongoose + Zod + Helmet + CORS allowlist + rate limiting + Pino. Cloudinary is configured for later upload work.

React Hook Form, Framer Motion, JWT/bcrypt and Multer are installed/planned for the admin and booking phases. They are not presented as functional in the public preview.

---

## Current layout

```text
client/
  public/brand/                     unmodified supplied logo
  src/app/                          providers, lazy public routes
  src/components/{layout,seo,ui}/   public shell and primitives
  src/hooks/                        public content queries
  src/layouts/                      public layout
  src/pages/public/                 all Phase 3 public pages
  src/services/                     validated public content API
  src/utils/                        WhatsApp settings, class helper
  src/styles/                       Tailwind entry + brand tokens
  src/test/                         fixtures and test setup
server/
  src/content/                      temporary demo content contract
  src/routes/public.routes.ts       read-only public API
  src/config/                       env, MongoDB, Cloudinary
  src/middleware/                   errors, rate limiting
  src/routes/health.routes.ts
  test/
docs/                               planning, brand, setup and Phase 3 notes
screenshots/                        Phase 3 visual review captures
package.json                        npm workspaces and root scripts
```

---

## Ground rules

- No fake clinic data, reviews, credentials, prices or statistics.
- Appointment requests are not confirmed until the clinic confirms them.
- Every future admin control will be connected to a real API operation.
- `.env` files and secrets are never committed.
- Production deployment requires explicit client approval.
- Existing user work is never deleted or overwritten.

---

## Next step

Review the [Phase 3 notes](docs/04-public-site.md) and screenshots, then approve Phase 4 (MongoDB models, authentication and admin CRUD). Deployment remains separately gated.
