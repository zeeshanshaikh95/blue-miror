# Blue Miror — Brand & Design System

> **Status:** Working direction for Phase 1, derived from the supplied logo. Subject to client approval before final polish.
> **Rule:** The supplied logo is the primary brand asset. It is never redrawn, recoloured, distorted, or replaced without written permission.

---

## 1. Supplied asset audit

| Item                     | Finding                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| File                     | `Blue Mirror logo.png` (original supplied by client)                                             |
| Working copy             | [`docs/assets/blue-miror-logo.png`](assets/blue-miror-logo.png) — byte-for-byte copy, unmodified |
| Dimensions               | 484 × 612 px, portrait                                                                           |
| Format                   | PNG, RGBA                                                                                        |
| Background               | Transparent (alpha channel present) — confirmed at the pixel level                               |
| Content bounds           | Approx. x 28–456, y 69–542, leaving built-in clear space                                         |
| Vector source            | **Not supplied** — a scalable SVG/EPS/PDF is still required for production                       |
| Light-background variant | **Not supplied** — the navy crest and wordmark are not legible on dark surfaces                  |
| Horizontal lockup        | **Not supplied** — the stacked portrait lockup is impractical at header scale                    |

The artwork contains a heraldic shield, a five-point crown, ornamental scrollwork, a gold ribbon bearing **BLUE MIROR**, and a central flame/lotus motif with a four-point sparkle. The wordmark is a wide, geometric sans in the same indigo as the shield.

**Semiotics:** the shield and crown signal trust, protection and heritage; the flame/lotus signals renewal and care; the sparkle signals radiance and refinement. The design direction should honour that heritage without looking like a traditional medical crest or a generic beauty template.

---

## 2. Brand character

| Attribute      | Direction                                                                          |
| -------------- | ---------------------------------------------------------------------------------- |
| Positioning    | Premium, modern, trustworthy, quietly luxurious                                    |
| Mood           | Editorial calm, clinical precision, warm hospitality                               |
| References     | Boutique skin clinics, luxury hospitality, art-directed beauty editorials          |
| Not            | Spa clichés, neon gradients, plastic “before/after” marketing, fake medical badges |
| Voice          | Assured, warm, precise, never overpromising                                        |
| Core narrative | Considered aesthetic care, guided by qualified professionals and honest advice     |

**Naming:** the brand is **Blue Miror** — always spelled with one “r”. Do not “correct” it to “Mirror”.

---

## 3. Colour system

Colours sampled directly from the supplied artwork:

| Token                | Hex       | Source                       | Role                                                         |
| -------------------- | --------- | ---------------------------- | ------------------------------------------------------------ |
| `indigo-500` / brand | `#424273` | Shield, wordmark, ribbon     | Primary brand colour: headings, primary buttons, dark panels |
| `indigo-900`         | `#26254B` | Derived UI shade             | Deep backgrounds, ink-like surfaces                          |
| `gold-500`           | `#C0994D` | Crown, shield border, ribbon | Accents, hairlines, ornament, large display italics          |
| `gold-700`           | `#8A6A2F` | Derived UI shade             | Gold text where readable contrast is required                |
| `azure-500`          | `#077CB3` | Central flame                | Accent: links, active states, small highlights               |
| `azure-700`          | `#05618F` | Derived UI shade             | Accessible link text on light backgrounds                    |
| `ivory-100`          | `#F7F4EE` | Derived neutral              | Primary page background                                      |
| `ivory-50`           | `#FCFAF6` | Derived neutral              | Alternating sections, cards                                  |
| `ink`                | `#23233D` | Derived neutral              | Body text                                                    |
| `muted`              | `#6B6A80` | Derived neutral              | Secondary text, captions                                     |
| `line`               | `#E6DFD3` | Derived neutral              | Hairline borders, dividers                                   |
| `success`            | `#2F6B4F` | Functional                   | Confirmations                                                |
| `error`              | `#9C3333` | Functional                   | Errors                                                       |

### Accessibility notes

Measured WCAG 2.x contrast ratios:

| Combination        | Ratio   | Verdict                                  |
| ------------------ | ------- | ---------------------------------------- |
| White on `#424273` | 9.30:1  | AAA — primary buttons                    |
| Ivory on `#26254B` | 13.21:1 | AAA — dark sections                      |
| `#23233D` on ivory | 13.87:1 | AAA — body text                          |
| `#6B6A80` on ivory | 4.78:1  | AA — secondary text                      |
| `#077CB3` on ivory | 4.21:1  | Accent only; not for small body text     |
| `#05618F` on ivory | 6.15:1  | AA — small links                         |
| `#C0994D` on ivory | 2.42:1  | Decorative only; never small text        |
| `#8A6A2F` on ivory | 4.57:1  | AA — gold text at normal size            |
| White on `#077CB3` | 4.62:1  | AA — azure buttons, large/bold text only |

Gold is a **jewellery accent**, not a text colour. Use it for thin rules, keylines, numbered markers, and occasional italic display words. Interactive elements never rely on colour alone.

### Extended scales (for implementation)

```css
/* Indigo */
--bm-indigo-50: #f2f2f6;
--bm-indigo-100: #e6e6ee;
--bm-indigo-200: #cbcbe0;
--bm-indigo-300: #a5a5c4;
--bm-indigo-400: #73739e;
--bm-indigo-500: #424273;
--bm-indigo-600: #373760;
--bm-indigo-700: #2c2b4e;
--bm-indigo-800: #26254b;
--bm-indigo-900: #1b1a38;

/* Gold */
--bm-gold-50: #faf6ec;
--bm-gold-100: #f3ead3;
--bm-gold-200: #e7d4a8;
--bm-gold-300: #d8bc7e;
--bm-gold-400: #cba95f;
--bm-gold-500: #c0994d;
--bm-gold-600: #a17d3c;
--bm-gold-700: #8a6a2f;
--bm-gold-800: #6f5526;

/* Azure */
--bm-azure-50: #edf7fc;
--bm-azure-100: #d8eef8;
--bm-azure-200: #b0dcf1;
--bm-azure-300: #7fc5e4;
--bm-azure-400: #3a9fcc;
--bm-azure-500: #077cb3;
--bm-azure-600: #05618f;
--bm-azure-700: #064f74;
--bm-azure-800: #083f5c;

/* Neutrals */
--bm-ivory-50: #fcfaf6;
--bm-ivory-100: #f7f4ee;
--bm-ivory-200: #efe9de;
--bm-line: #e6dfd3;
--bm-ink: #23233d;
--bm-muted: #6b6a80;
```

Recommended usage ratio: **70 % ivory/white, 20 % indigo, 7 % azure, 3 % gold**. Gold earns its impact by being scarce.

---

## 4. Typography

| Role               | Typeface                                     | Why                                                                                      |
| ------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Display / headings | **Cormorant Garamond** (400/500/600, italic) | High-contrast editorial serif; lends a couture, established feel that balances the crest |
| Body / UI          | **Jost** (300/400/500/600)                   | Geometric sans close in spirit to the wordmark; clean at small sizes                     |
| Wordmark           | Supplied logo artwork only                   | Never re-set the name as a substitute logo                                               |

Both families are open-licensed (SIL OFL) and will be self-hosted through Fontsource to avoid third-party font requests. Fallbacks: `Georgia, 'Times New Roman', serif` and `system-ui, sans-serif`.

### Type scale (fluid, mobile-first)

| Utility      | Size                         | Notes                                               |
| ------------ | ---------------------------- | --------------------------------------------------- |
| `display-xl` | `clamp(3.25rem, 7vw, 6rem)`  | Hero only; line-height 0.95–1.0                     |
| `display-lg` | `clamp(2.5rem, 4.5vw, 4rem)` | Page titles                                         |
| `display-md` | `clamp(2rem, 3vw, 3rem)`     | Section headings                                    |
| `heading-sm` | `1.375–1.625rem`             | Cards, subsections                                  |
| `body-lg`    | `1.0625–1.125rem`            | Intro copy; line-height 1.7                         |
| `body`       | `1rem`                       | Default; line-height 1.7                            |
| `small`      | `0.875rem`                   | Captions, helper text                               |
| `eyebrow`    | `0.6875rem`                  | Uppercase, tracking `0.22em`, gold-700 or azure-700 |

Rules: sentence case for headings; uppercase only for eyebrows, buttons and short labels; measure 55–70 characters; no display serif below 24 px; italics reserved for one emphasis phrase per heading.

---

## 5. Layout, shape and spacing

- **Grid:** 12 columns, max content width 1280 px; gutters 20 px mobile / 32 px tablet / 48 px desktop.
- **Section rhythm:** 80 px mobile / 112 px tablet / 144 px desktop vertical padding. Alternate ivory and white; one full indigo band per page maximum.
- **Spacing scale:** 4 px base — 4, 8, 12, 16, 24, 32, 48, 64, 80, 112, 144.
- **Shape:** precise 2–4 px radii for buttons and inputs; 6 px for cards; images use an **arch** (top-rounded) motif that echoes the shield and the idea of a mirror. No uniformly pill-shaped cards, no floating blob decorations.
- **Borders:** 1 px `--bm-line`; gold hairline accents on feature elements. Shadows are rare and soft: `0 24px 64px rgb(38 37 75 / 0.08)` for overlays only.
- **Header:** 84 px desktop, 68 px mobile; ivory/translucent until scroll, then solid ivory with a hairline. Logo left, nav centre, “Book a consultation” right.
- **Footer:** deep indigo with ivory type, gold hairline top, logo on a light “plaquette” until an approved light logo variant exists.
- **Texture:** none beyond photography; avoid grain filters, glassmorphism and heavy gradients. One subtle azure-to-indigo gradient may appear only inside the hero image treatment or a CTA hover, never behind body copy.

---

## 6. Components

| Component        | Treatment                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Primary button   | Indigo fill, ivory label, 2 px radius, uppercase 12 px / 0.14em tracking; hover deepens to indigo-600 with a gold hairline inset |
| Secondary button | Transparent, 1 px indigo keyline; hover ivory-50 fill                                                                            |
| Text link        | Indigo with gold-700 underline offset; hover underline extends                                                                   |
| Service card     | Image (4:5 arch), eyebrow category, serif title, one-line description, arrow link; 1 px border, no shadow                        |
| Feature band     | Deep indigo, ivory serif statement, gold rule, one restrained image                                                              |
| Testimonial      | Large serif quote, small sans attribution, gold quote mark; no star ratings unless genuine ratings are supplied                  |
| Form fields      | White surface, 1 px line, 2 px radius, visible label above, helper text, 2 px azure focus ring                                   |
| Accordion        | Hairline rows, serif question, plus/minus icon, 300 ms height transition                                                         |
| Table (admin)    | Sticky header, 1 px row rules, no zebra stripes, status pills in accessible tints                                                |
| Status pills     | Pending = gold tint, Confirmed = azure tint, Completed = green tint, Cancelled = red tint; always include text                   |
| Empty state      | Short editorial line plus the action that resolves it; no cartoon illustrations                                                  |
| Loading          | Neutral skeleton blocks matching final dimensions; no spinners for page-level loads                                              |

Iconography: Lucide React at 1.5 px stroke, 18–22 px. Icons support labels; they do not replace them.

---

## 7. Photography & art direction

- Natural window light, real skin texture, warm neutral tones, calm interiors. No heavy orange/teal filters, no overly airbrushed faces.
- Composition: 4:5 editorial portraits, 3:2 interior/process images, 1:1 detail shots for gallery tiles.
- Treatment imagery shows the clinic environment, considered tools, and practitioners at work — not implied outcomes.
- Before/after imagery is permitted **only** with genuine photographs, explicit written client consent, and clinic approval. Until then, the section is absent — not simulated.
- Placeholder stock must be properly licensed; each asset will be recorded with source/licence and replaced before launch.
- Every image has descriptive alt text; decorative images use empty alt.

---

## 8. Motion

- One reveal language: 16–20 px rise + fade over 500 ms, `cubic-bezier(0.22, 1, 0.36, 1)`, 60 ms stagger for sibling items.
- Image hover: scale to 1.03 over 600 ms, no bounce. Buttons: 180 ms colour transition.
- No auto-playing carousels, no scroll hijacking, no aggressive parallax, no looping sparkle effects.
- `prefers-reduced-motion: reduce` removes transforms and shortens transitions. Content is never hidden until an animation runs.

---

## 9. Logo usage rules

**Do**

- Use the supplied file unmodified, with preserved aspect ratio, on ivory/white or approved light surfaces.
- Keep clear space equal to at least the crown height on all sides.
- Minimum sizes: 120 px wide for the stacked lockup, 32 px for the crest where an approved mark exists.
- Use a plain light plaquette behind the logo if the background is variable.

**Don't**

- Recolour, outline, emboss, add glow, or place over busy imagery.
- Stretch, crop, rotate, or rebuild the wordmark in another font.
- Use the crest as a repeating decorative pattern or bullet icon.
- Use the navy logo on indigo until an approved light/mono variant is supplied.

**Pending official assets:** vector master; transparent light/white lockup for the footer; horizontal lockup for the header; favicon mark; brand guideline PDF; confirmation of the exact typeface used in the wordmark.

---

## 10. Copy & claims policy

- No guaranteed results, no “miracle”, “permanent”, “painless” or “risk-free” claims.
- No invented qualifications, registrations, awards, certifications, review counts or statistics.
- Treatment information is educational and always followed by “Suitability and risks should be discussed in a consultation.”
- Prices are not displayed unless the clinic supplies an approved pricing policy.
- Testimonials are published only after verification and consent; names may be initials.
- Legal and medical copy is drafted as a clearly marked template for clinic/legal review, not presented as final advice.
