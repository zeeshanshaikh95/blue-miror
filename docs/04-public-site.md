# Blue Miror — Public Website (Phase 3)

> **Status:** Phase 3 public experience complete. The public pages, design system, responsive layouts, API-driven treatments and tests are in place. Authentication, admin CRUD, booking persistence and deployment are not part of this phase.

---

## 1. Scope delivered

The public site is a service-led aesthetic clinic experience using the supplied Blue Miror logo, the sampled brand palette and Cormorant Garamond + Jost. There are **no product, cart, checkout, inventory, payment or e-commerce features**.

Implemented routes:

| Route                 | Page                     | Current content behaviour                                                         |
| --------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `/`                   | Home                     | Hero, approach, featured services, visual direction, FAQs and booking entry point |
| `/about`              | About                    | Brand point of view, standards and team preview                                   |
| `/treatments`         | Treatments               | API-driven list with search, category filters and URL-synced state                |
| `/treatments/:slug`   | Dynamic treatment detail | API lookup, benefits, considerations, FAQs, related treatments and CTA            |
| `/gallery`            | Gallery                  | API-driven placeholder photography with category filters                          |
| `/testimonials`       | Client stories           | Verified-only empty state; no reviews are invented                                |
| `/team`               | Team                     | Credentials-first empty state; no names or qualifications invented                |
| `/contact`            | Contact                  | Settings-driven contact slots; unconfigured details remain pending                |
| `/faqs`               | FAQs                     | API-driven draft answers grouped by category                                      |
| `/book`               | Booking information      | Explains the WhatsApp-first flow; no request form is implemented yet              |
| `/privacy-policy`     | Privacy template         | Clearly labelled legal draft                                                      |
| `/terms`              | Terms template           | Clearly labelled legal draft                                                      |
| `/medical-disclaimer` | Medical disclaimer       | Clearly labelled medical/legal draft                                              |
| `*`                   | 404                      | Helpful public navigation and `noindex`                                           |

The header, footer, mobile navigation disclosure, booking CTA, skip link and floating WhatsApp control are shared across every public route. All public pages are marked `noindex` until approved content is supplied; indexing is controlled by `VITE_ALLOW_INDEXING`.

---

## 2. Temporary read-only content contract

Phase 4 will create the MongoDB models, admin CRUD and real public projections. Until then, Phase 3 uses a deliberately temporary read-only API:

```text
GET /api/public/settings
GET /api/public/services?q=&category=&featured=&limit=
GET /api/public/services/:slug
GET /api/public/gallery?category=&limit=
GET /api/public/testimonials
GET /api/public/team
GET /api/public/faqs
```

Source: [`server/src/content/public-content.ts`](../server/src/content/public-content.ts).
Routes: [`server/src/routes/public.routes.ts`](../server/src/routes/public.routes.ts).

Every record is marked `isDemo` or `isPlaceholder`. This is **not** a database seed and must not be treated as clinic-approved information. In Phase 4 it will be replaced by Mongoose-backed public controllers; the client contract in [`client/src/services/public-content.ts`](../client/src/services/public-content.ts) is already validated with Zod.

The client does not contain a hardcoded treatment list. Service cards and detail pages read the API response. Test fixtures under `client/src/test/` exist only for automated tests.

---

## 3. What remains a placeholder

| Area                     | Current approach                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Clinic story             | Draft narrative; founder, legal name and milestones are not invented                                                              |
| Contact details          | Address, phone, email, hours and map render as pending; no fake values or links                                                   |
| WhatsApp                 | Disabled in settings; no number is hardcoded. All CTAs route to `/book` until a configured number exists                          |
| Treatment names and copy | Generic sample services, each marked “Sample content”; medical review is pending                                                  |
| Prices                   | Never displayed; the UI states that pricing is published only with clinic approval                                                |
| Photography              | Branded CSS/SVG-like compositions marked “Image placeholder”; no stock clinic images or simulated results                         |
| Gallery                  | Placeholder visual studies; no before/after images                                                                                |
| Testimonials             | Empty verified-only state; no quotes, names or ratings invented                                                                   |
| Team                     | Empty credentials-first state; no sample practitioners                                                                            |
| FAQs                     | Draft answers describing the planned website experience, marked as drafts                                                         |
| Legal pages              | Clearly labelled drafting frameworks, not legal advice                                                                            |
| Booking                  | Informational only. No appointment records, no request form, no WhatsApp status changes. Phase 5 implements persistence and admin |

The global preview bar remains visible until launch so placeholder content cannot be mistaken for approved clinic content.

---

## 4. Design and component system

- Palette: indigo, gold jewellery accent, azure highlight, ivory and porcelain surfaces; gold is never used for small text.
- Typography: self-hosted Cormorant Garamond display and Jost UI/body fonts.
- Layout: 12-column feel with a 1280 px maximum container, generous section rhythm, arch motifs and restrained gold hairlines.
- The supplied PNG logo is used unmodified in the header and footer light plaque. It is never recoloured, cropped or redrawn.
- Shared primitives: `Container`, `Button`, `PageHero`, `SectionHeading`, `ServiceCard`, `BrandVisual`, `Accordion`, `Breadcrumbs`, `BookingLink`, `WhatsAppFab`, `EmptyState`, `ErrorState`, `LoadingState` and `Seo`.
- Pages are lazy-loaded; route chunks keep the public entry bundle smaller.
- `prefers-reduced-motion` is respected by the global stylesheet. Motion is limited to colour and hover transitions.

### Booking settings architecture

All booking CTAs consume `SiteSettings` from `/api/public/settings`. No WhatsApp number, country code or CTA label lives in the UI:

- `whatsapp.enabled`, `countryCode`, `number`, `defaultMessage`, `bookingMessageTemplate`, `serviceEnquiryTemplate` and `cta` labels are data.
- `buildWhatsAppUrl`, `buildBookingWhatsAppUrl` and `buildServiceEnquiryUrl` create links only when a plausible configured number exists.
- When WhatsApp is not configured, no floating button or external WhatsApp link is rendered. The CTA falls back to the informational `/book` route.
- Opening WhatsApp never changes appointment status; no appointment APIs exist in Phase 3.

---

## 5. Accessibility and responsive verification

Implemented:

- Skip-to-content link, one `main` landmark, header/footer landmarks and labelled navigation.
- Visible keyboard focus ring using the azure focus colour.
- Mobile navigation is a disclosure with `aria-expanded`, `aria-controls`, Escape-to-close and focusable links.
- Accordions use buttons with `aria-expanded` / `aria-controls` and labelled regions.
- Treatments search has a visible label; filters expose `aria-pressed`; result counts use `aria-live`.
- Loading states use `role="status"` and meaningful names; errors use `role="alert"` and a retry action.
- Image placeholders have descriptive accessible names; decorative shapes are hidden from assistive technology.
- No icon-only controls without an accessible name.
- Invalid/unknown treatment slugs produce a designed not-found state.

Responsive checks were performed at a 390 px mobile viewport and a 1440 px desktop viewport. The mobile document has no horizontal page overflow; decorative circles are clipped inside their sections. `window.scrollWidth` was 374 px at a 390 px viewport. Screenshots are in [`screenshots/`](../screenshots/).

---

## 6. Verification

Phase 3 final checks:

| Check                  | Result                                                          |
| ---------------------- | --------------------------------------------------------------- |
| `npm run format:check` | Passed                                                          |
| `npm run typecheck`    | Passed for client and server                                    |
| `npm run lint`         | Passed for client and server                                    |
| `npm run test`         | 38 passed — 20 client, 18 server                                |
| Production build       | Passed — client and server                                      |
| Local HTTP preview     | Client 200, API public endpoints 200; no browser console errors |
| Responsive check       | 390 px and 1440 px; no horizontal page overflow at 390 px       |

The production build was a verification build using reserved `.invalid` API/site origins. It is not a deployment. Non-fatal Rollup warnings originate inside Zod 4 comments and do not affect the successful build.

---

## 7. Unresolved items for later phases

1. **MongoDB-backed content:** replace the temporary API fixtures with Phase 4 models, controllers, admin CRUD and public projections.
2. **Authentication/admin:** Phase 4.
3. **Booking persistence and WhatsApp handoff:** Phase 5; `/book` intentionally does not collect or submit a request yet.
4. **Contact and testimonial submissions:** later phases; no form is presented as functional while no endpoint exists.
5. **Real clinic content:** services, treatment names, prices policy, contact details, WhatsApp number, hours, map, legal wording and approved photography are still pending from the client.
6. **Logo variants / photography:** vector and light/horizontal lockups, favicon mark and licensed clinic imagery are still missing.
7. **Legal review:** the three legal pages are drafting frameworks only.
8. **SEO indexing:** `VITE_ALLOW_INDEXING=false` until approved content is live. GitHub Pages prerendering for deep links remains a Phase 9/10 concern.
9. **Cloudinary:** no live upload or transformation testing has been performed.
10. **E2E/axe:** component and route tests are present; full Playwright/axe runs remain in Phase 8.

---

## 8. Screenshots

- [Homepage — desktop](../screenshots/home-desktop.png)
- [Homepage — full page](../screenshots/home-full.jpg)
- [Homepage — mobile](../screenshots/home-mobile.png)
- [Treatments](../screenshots/treatments-desktop.png)
- [Treatment detail](../screenshots/treatment-detail.png)
- [Gallery](../screenshots/gallery-desktop.png)
- [About](../screenshots/about-desktop.png)
- [Contact](../screenshots/contact-desktop.png)
- [FAQs](../screenshots/faqs-desktop.png)
