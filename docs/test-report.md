# Blue Miror — Test Report

> Last run: 2026-11-18, on the local development machine (Windows, Node 22.19.0).
> All results below come from commands that were actually executed in this
> workspace. Nothing is inferred.

## 1. Commands and gates

```bash
cd server && npm run format:check && npm run typecheck && npm run lint && npm test && npm run build
cd client && npm run format:check && npm run typecheck && npm run lint && npm test && npm run build
```

| Gate                               | server                              | exit | client                                           | exit |
| ---------------------------------- | ----------------------------------- | ---- | ------------------------------------------------ | ---- |
| `format:check` (Prettier)          | pass                                | 0    | pass                                             | 0    |
| `typecheck` (tsc, strict)          | pass                                | 0    | pass                                             | 0    |
| `lint` (ESLint, no rules disabled) | pass                                | 0    | pass                                             | 0    |
| `test` (Vitest)                    | pass — 16 files, 134 tests          | 0    | pass — 17 files, 85 tests                        | 0    |
| `build`                            | pass (`tsc -p tsconfig.build.json`) | 0    | pass (`tsc --noEmit && vite build` + SEO script) | 0    |

Server tests run with `fileParallelism: false` against an ephemeral
`mongodb-memory-server` instance; environment values come from
`server/vitest.config.ts`, so no secrets are required. The suite runs with
Mongoose `sanitizeFilter` enabled, matching production.

Client suites render the whole route tree in jsdom. `src/test/setup.ts` raises
Testing Library's async query timeout to 5 s: on a loaded machine a first paint
can exceed the 1 s default and produced intermittent "unable to find" failures in
a full parallel run. Assertions are unchanged and every case still fails when the
expected element or behaviour is missing.

## 2. Server test inventory (16 files, 134 tests)

| File                                  | Focus                                                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/auth/auth.test.ts`              | Login, token issuance, credential failures                                                                                                                                            |
| `test/auth/authz.test.ts`             | Role enforcement on admin endpoints                                                                                                                                                   |
| `test/auth/session-lifecycle.test.ts` | Session persistence, revocation, expiry, password-change invalidation                                                                                                                 |
| `test/auth/login-throttle.test.ts`    | Account lockout, cooldown, public endpoints unaffected                                                                                                                                |
| `test/auth/password-change.test.ts`   | Current-password check, weak/unchanged password rejection, session revocation, new credential accepted                                                                                |
| `test/admin/admin.test.ts`            | Services, categories, gallery, team, testimonials, FAQs and settings CRUD                                                                                                             |
| `test/admin/inbox.test.ts`            | Inbox lists, detail, status transitions, history, moderation, summary                                                                                                                 |
| `test/admin/media.test.ts`            | Upload auth, missing file, non-image bytes, unknown folder, unconfigured Cloudinary, foreign public-ID deletion                                                                       |
| `test/admin/reorder.test.ts`          | Service and category ordering, invalid reorder payload, category delete guard                                                                                                         |
| `test/admin/audit-log.test.ts`        | Audit entries for settings/service/category writes, login success, login failure, logout and password change; body/password never stored; auth required; action filter and pagination |
| `test/public/submissions.test.ts`     | Appointment/enquiry/contact/testimonial submissions, duplicate window, consent, honeypot, and the date-filter integration suite                                                       |
| `test/public/projections.test.ts`     | Public projections never expose internal fields                                                                                                                                       |
| `test/public-content.test.ts`         | Public content endpoints, empty states, draft records excluded, `homepage` block present                                                                                              |
| `test/content/service.test.ts`        | Argon2id hashing behaviour                                                                                                                                                            |
| `test/env.test.ts`                    | Environment validation rules                                                                                                                                                          |
| `test/health.test.ts`                 | Health endpoint up/degraded behaviour                                                                                                                                                 |

### Date-filter integration suite (Phase 7 follow-up)

Seven tests against the real MongoDB query, not a mock:

1. `from` only, newest-first ordering.
2. `to` only, whole-day inclusive.
3. `from` and `to` together.
4. Records exactly on both boundaries included; the day after `to` excluded.
5. Range with no matches returns an empty page.
6. Invalid `from`/`to` values return `422 VALIDATION_ERROR`.
7. Date range combined with `status` and `pagination` (totals, page metadata,
   disjoint page contents, status enforcement).

## 3. Client test inventory (17 files, 85 tests)

| File                                            | Focus                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/App.test.tsx`                          | Homepage, treatment detail, 404, mobile navigation, public 404 route                                                                                   |
| `src/pages/public/TreatmentsPage.test.tsx`      | Search, category filter, loading skeleton, error state                                                                                                 |
| `src/pages/public/ContactPage.test.tsx`         | Contact details hidden when unset, WhatsApp link from settings                                                                                         |
| `src/pages/public/GalleryPage.test.tsx`         | Category filtering of placeholder imagery                                                                                                              |
| `src/pages/public/settings-visibility.test.tsx` | Booking disabled state, floating WhatsApp hidden when the toggle/number is off, gallery/featured/FAQ toggles, tagline-optional regression              |
| `src/components/forms/public-forms.test.tsx`    | Consent gating, validation, submission behaviour                                                                                                       |
| `src/components/ui/Accordion.test.tsx`          | Accessible disclosure keyboard behaviour                                                                                                               |
| `src/admin/admin-login.test.tsx`                | Redirect when anonymous, sign-in, sign-out                                                                                                             |
| `src/admin/admin-content.test.tsx`              | Service creation, gallery/team creation, settings save                                                                                                 |
| `src/admin/admin-settings.test.tsx`             | Homepage copy and section visibility save, schema-only payload, save failure surfaces the API message, booking and floating-button toggles             |
| `src/admin/admin-account.test.tsx`              | Anonymous redirect, minimum length, mismatch, unchanged password, current-password rejection, success revokes the session and redirects to login       |
| `src/admin/admin-service-details.test.tsx`      | Price/duration/SEO/related round-trip, blank optionals sent as `null`/`[]`, self-relation rejection                                                    |
| `src/admin/media-uploader.test.tsx`             | Type and size validation before upload, progress reporting, preview of the stored URL, upload error surface, delete confirmation and public-ID cleanup |
| `src/admin/admin-inbox.test.tsx`                | Inbox tabs, search, status filter, detail + status change, WhatsApp handoff, consent-gated publishing, invalid date handling, error retry              |
| `src/admin/admin-api.test.ts`                   | API client request shapes and error mapping                                                                                                            |
| `src/lib/api-client.test.ts`                    | Fetch wrapper behaviour                                                                                                                                |
| `src/utils/whatsapp.test.ts`                    | URL building, encoding, missing-number safety                                                                                                          |

The five admin/visibility files above were added in this round (21 tests) plus one
regression test for the nullable tagline (85 total, up from 63).

## 4. Browser QA performed

Playwright and axe are not installed in this workspace, so the flows below were
driven with the local Chromium preview tooling against a temporary harness
(`server/.qa-start.mjs`, since deleted): API on `http://localhost:4000` with an
in-memory MongoDB, Vite dev server on `http://localhost:5173`. Screenshots were
not captured; results are observations and API assertions, not images.

| Flow                                                                                                   | Result                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Admin sign-in and overview counts                                                                      | Pass                                                                                                                                    |
| Settings page render (identity/contact/WhatsApp/booking/homepage panels), save, persistence            | Pass after fixing two defects (see §4.1)                                                                                                |
| Public homepage honouring settings (hero copy, gallery section hidden, WhatsApp FAB and `wa.me` links) | Pass                                                                                                                                    |
| Booking form submit → persisted `pending` request with reference and "nothing is booked yet" wording   | Pass after fixing a server defect                                                                                                       |
| Inbox list, detail dialog, status change to `contacted` with history                                   | Pass; audit entry `appointment.update` recorded                                                                                         |
| Service edit incl. price, duration, SEO title/description, related slugs                               | Pass; server stored the values; self-relation rejected by validation                                                                    |
| Account password change: wrong current password, then successful change                                | Pass; old password 401, new password 200, UI redirected to `/admin/login`                                                               |
| Mobile navigation at 390 × 844                                                                         | Pass; drawer opens with the expected links, no horizontal overflow                                                                      |
| Media upload                                                                                           | Not possible without Cloudinary credentials — the API returns `503 MEDIA_UNAVAILABLE`; the uploader error path is covered by unit tests |
| Accessibility audit (axe)                                                                              | Not run (not installed)                                                                                                                 |

### 4.1 Defects found and fixed during browser QA

1. Settings save returned `422`: the client draft echoed `_id`, `__v` and
   timestamps into a `.strict()` schema. `toDraft`/`fromDraft` now whitelist
   schema fields.
2. Public settings schema rejected `site.tagline: null`, which silently disabled
   every settings-driven public surface. Now nullable, with a regression test.
3. The public settings projection omitted `homepage`, so homepage copy fell back
   to defaults. Added to the projection and its type.
4. Booking submission returned `500`: `createdAt: { $gte: … }` was rewritten by
   `sanitizeFilter`. Server-authored operators now use `mongoose.trusted(…)`
   (also for session cleanup, the inbox date range and `publishedAt: { $ne: null }`).
5. Public service/gallery/FAQ queries did not filter `publishedAt`, so drafts were
   publicly visible. Public reads now return published records only.

## 5. Not executed (documented limitations)

- **Playwright/Cypress/axe:** not installed. No automated end-to-end or
  accessibility audit was run; browser QA was manual as described in §4.
- **Visual/responsive screenshots:** none captured in this round.
- **Real Cloudinary uploads:** no credentials. Validation, progress, error and
  delete paths are covered by unit tests; the Cloudinary call itself is not
  exercised.
- **Production deployment:** not performed, by instruction.

## 6. Flakiness notes

The full client suite renders many heavy route trees in parallel. Rather than
per-test overrides, `src/test/setup.ts` sets one async query timeout (5 s). The
suite has passed in every run since (one single-file run and one full gate run); a
single earlier full run showed eight timeout-shaped failures before the change.
