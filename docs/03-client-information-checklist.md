# Blue Miror — Client Information & Asset Checklist

This is the information the project needs from the clinic. It is deliberately specific so nothing has to be invented. Items marked **Blocker** must be resolved before production launch; development can proceed with clearly marked placeholders in the meantime.

> **Phase 3 note:** the public website is built with a read-only demo content contract. Every service, gallery image, testimonial, team profile, contact detail and FAQ is either a labelled placeholder or absent. No item on this checklist has been assumed supplied.

> **Security:** never send passwords, API secrets, private keys or database connection strings in chat. Share them through a password manager or a secure handoff, and invite the developer as a collaborator on the relevant service instead of sharing the owner account.

---

## 1. Brand assets

| #   | Needed                                                              | Status                                                                       | Blocker?        | Notes / placeholder behaviour                                                                       |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| 1.1 | Original logo file supplied                                         | ✅ Received (`Blue Mirror logo.png`, 484 × 612 RGBA, transparent background) | —               | Preserved unmodified in `docs/assets/`                                                              |
| 1.2 | Vector master (SVG, EPS, AI or PDF)                                 | ❌ Missing                                                                   | Yes, for launch | Current PNG is adequate for development but not ideal for all screen densities                      |
| 1.3 | Horizontal lockup (crest + wordmark side by side)                   | ❌ Missing                                                                   | Recommended     | Stacked portrait lockup is awkward in the header; use supplied PNG in a light brand panel meanwhile |
| 1.4 | Light / white / mono version for dark surfaces                      | ❌ Missing                                                                   | Yes             | Navy logo is not legible on the indigo footer; use a light plaquette until supplied                 |
| 1.5 | Favicon / app icon mark                                             | ❌ Missing                                                                   | Recommended     | Interim favicon derived from the crest only, without recolouring; replace with official mark        |
| 1.6 | Brand guidelines / exact wordmark typeface                          | ❌ Missing                                                                   | No              | Working direction: Cormorant Garamond + Jost (see brand guidelines)                                 |
| 1.7 | Permission for logo cropping/scaling as required for header/favicon | ❌ Confirm                                                                   | Yes             | Written confirmation that derivative sizing/cropping is allowed                                     |

**Do not** send a redesigned or recoloured logo. If the supplied file is not the final version, send the final master before launch.

---

## 2. Business identity

| #   | Needed                                                         | Example / format                                               | Blocker?                            |
| --- | -------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| 2.1 | Exact public business name                                     | “Blue Miror” (confirm casing)                                  | No — confirmed by brief             |
| 2.2 | Legal entity name (for policies/contracts, may remain private) | Registered name                                                | Yes, for legal pages                |
| 2.3 | Tagline / short positioning line                               | e.g. “Considered aesthetic care”                               | No — placeholder is neutral         |
| 2.4 | Year established / clinic story                                | Verified facts only                                            | No — sections hidden or placeholder |
| 2.5 | Mission, vision and philosophy copy                            | 100–250 words each                                             | No — editable placeholders          |
| 2.6 | Registrations, licences or certifications to display           | Only with proof and correct wording                            | No — never invented                 |
| 2.7 | Practitioner qualifications and supervising clinician details  | Name, role, verified credential, registration number if public | No — hidden until verified          |

---

## 3. Contact and location (NAP)

| #    | Needed                                                | Format                                                                 | Blocker?                                      |
| ---- | ----------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| 3.1  | Public address                                        | Street, area, city, postcode, country                                  | Yes                                           |
| 3.2  | Primary phone                                         | Country code + number, display format                                  | Yes                                           |
| 3.2a | Booking channel confirmation                          | WhatsApp is the primary channel; phone/contact form remain secondary   | Yes                                           |
| 3.3  | WhatsApp number and country code                      | Separately supplied; digits only for `wa.me`                           | Yes — WhatsApp is the primary booking channel |
| 3.4  | Default WhatsApp message and booking message template | Default greeting; approved template for prefilled appointment messages | Yes — no message content is invented          |
| 3.4a | Booking CTA labels                                    | Primary booking button, floating-button label, service-enquiry label   | No — editable admin defaults                  |
| 3.4b | Confirm WhatsApp is the primary booking channel       | Written confirmation of the intended booking workflow                  | Yes                                           |
| 3.5  | Public email                                          | `hello@…` or similar                                                   | Yes                                           |
| 3.6  | Business hours                                        | Day ranges, open/close, closed days, holiday notes                     | Yes                                           |
| 3.7  | Clinic timezone                                       | e.g. `Asia/Karachi`                                                    | Yes — appointment dates depend on it          |
| 3.8  | Google Maps location                                  | Place link, embed URL or Place ID; exact pin                           | Yes                                           |
| 3.9  | Directions / parking / accessibility notes            | Short copy                                                             | No                                            |
| 3.10 | Social profiles                                       | Instagram, Facebook, TikTok, YouTube URLs                              | No — icons hidden until supplied              |
| 3.11 | Google Business Profile link                          | If it exists                                                           | No                                            |
| 3.12 | Preferred contact method and response time            | e.g. “WhatsApp within one working day”                                 | No                                            |

The NAP details are used on the website, contact page, structured data and footer. They must stay identical everywhere.

---

## 4. Treatments and services

| #    | Needed                                                                      | Blocker?                         |
| ---- | --------------------------------------------------------------------------- | -------------------------------- |
| 4.1  | Final list of treatments actually offered                                   | Yes                              |
| 4.2  | Category structure (e.g. facial, skin, body, injectables — only if offered) | Yes                              |
| 4.3  | Short description for each treatment (1–2 sentences)                        | Yes                              |
| 4.4  | Long description / procedure overview for each                              | Yes                              |
| 4.5  | Potential benefits, clearly non-guaranteed                                  | Yes                              |
| 4.6  | Suitability and contraindications/precautions                               | Yes — clinic/medical review      |
| 4.7  | Aftercare information, if applicable                                        | If offered                       |
| 4.8  | Treatment-specific FAQs and approved answers                                | Recommended                      |
| 4.9  | Who performs each treatment and their verified qualification                | Yes, if displayed                |
| 4.10 | Duration / number of sessions, if displayed                                 | No — omit unless verified        |
| 4.11 | Pricing policy: hide prices, “from” prices, price on consultation           | Yes — no prices will be invented |
| 4.12 | Approved images for each treatment (licensed or clinic-owned)               | Recommended                      |
| 4.13 | Written approval that public copy is accurate and not misleading            | Yes — medical/legal sign-off     |

Content will be entered through the admin dashboard. It can be supplied in a document first; the clinic must approve the final wording before publication.

---

## 5. Team

| #   | Needed                                                 | Blocker?                        |
| --- | ------------------------------------------------------ | ------------------------------- |
| 5.1 | Names and designations of team members to publish      | No — team section can be hidden |
| 5.2 | Verified qualifications and professional registrations | Yes, for any member published   |
| 5.3 | Short biographies (approved wording)                   | Recommended                     |
| 5.4 | Professional photographs with usage permission         | Recommended                     |
| 5.5 | Whether each member is clinical or non-clinical        | Yes, for correct labels         |

Only verified information is published. If a member’s credentials are not ready, their profile is unpublished rather than filled with assumptions.

---

## 6. Photography and gallery

| #   | Needed                                                                                          | Blocker?                              |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------- |
| 6.1 | Clinic interior/exterior photos                                                                 | Recommended                           |
| 6.2 | Treatment, detail and brand photography                                                         | Recommended                           |
| 6.3 | Team photographs + consent                                                                      | Recommended                           |
| 6.4 | Before/after photographs with explicit written client consent                                   | Only if the clinic wants this section |
| 6.5 | Confirmation of advertising/medical rules for before/after imagery in the clinic’s jurisdiction | Yes, before publishing any            |
| 6.6 | Photographer licence/usage rights for supplied images                                           | Yes, for supplied images              |
| 6.7 | Alt-text descriptions or permission to write descriptive alt text                               | No                                    |

The before/after section stays hidden until genuine, consented pairs are supplied. No stock photos will be presented as results.

---

## 7. Testimonials and reviews

| #   | Needed                                                                | Blocker?                    |
| --- | --------------------------------------------------------------------- | --------------------------- |
| 7.1 | Genuine client testimonials with permission to publish                | No — section hidden if none |
| 7.2 | Display preference: full name, initials, or anonymous                 | Recommended                 |
| 7.3 | Treatment and approximate date (if to be displayed)                   | Recommended                 |
| 7.4 | Source of review (Google, Instagram, in-clinic)                       | Recommended                 |
| 7.5 | Confirmation that no incentive was given where disclosure is required | Yes                         |
| 7.6 | Process for handling new public submissions                           | Recommended                 |

No testimonials will be written, paraphrased or invented by the developer. Submissions enter a moderation queue.

---

## 8. Appointment operations

| #    | Needed                                                                                                                       | Blocker?                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 8.1  | Who receives new appointment requests                                                                                        | Yes — email inbox / dashboard owner         |
| 8.2  | Notification email address and provider/SMTP details (secure handoff)                                                        | Yes, for email alerts                       |
| 8.3  | Available time slots / consultation windows                                                                                  | Yes, or use “any time” and clinic follow-up |
| 8.4  | Minimum notice and maximum advance booking window                                                                            | Recommended                                 |
| 8.5  | Closure dates / holidays handling                                                                                            | Recommended                                 |
| 8.6  | Expected response time shown to clients                                                                                      | Recommended                                 |
| 8.7  | Whether appointment requests may include a preferred practitioner                                                            | Only if offered                             |
| 8.8  | Consent wording for contact and privacy                                                                                      | Yes — clinic/legal approval                 |
| 8.9  | Internal workflow for statuses (pending → confirmed → completed/cancelled)                                                   | Recommended                                 |
| 8.10 | Confirmation that opening WhatsApp does **not** confirm an appointment and that staff must approve requests in the dashboard | Yes — workflow alignment                    |
| 8.11 | Approved wording for the “request received, pending confirmation” screen                                                     | Recommended                                 |

The site collects appointment **requests**, not confirmed bookings. No medical history or sensitive health data is collected in the form.

---

## 9. Legal, privacy and compliance

| #   | Needed                                                                                  | Blocker?               |
| --- | --------------------------------------------------------------------------------------- | ---------------------- |
| 9.1 | Legal entity, jurisdiction and governing law                                            | Yes                    |
| 9.2 | Privacy contact and data controller details                                             | Yes                    |
| 9.3 | Data retention expectations for enquiries, appointments and contact messages            | Yes                    |
| 9.4 | Approved privacy policy / terms / medical disclaimer, or reviewer for drafted templates | Yes                    |
| 9.5 | Cookie/analytics consent requirements (if analytics is added)                           | Yes, if analytics used |
| 9.6 | Medical advertising constraints in the jurisdiction                                     | Yes                    |
| 9.7 | Confirmation of claims that may and may not be made                                     | Yes                    |
| 9.8 | Age policy / minors policy, if relevant                                                 | Recommended            |

Drafted legal pages are templates only and must be reviewed by the clinic’s legal adviser. The developer does not provide legal or medical advice.

---

## 10. SEO and analytics

| #    | Needed                                                    | Blocker?                  |
| ---- | --------------------------------------------------------- | ------------------------- |
| 10.1 | Final domain name + DNS access                            | Yes                       |
| 10.2 | Preferred canonical host (`www` vs apex)                  | Yes                       |
| 10.3 | Target city/service area and priority treatments          | Recommended               |
| 10.4 | Google Business Profile URL and verification access       | Recommended               |
| 10.5 | Google Search Console verification                        | Recommended               |
| 10.6 | Analytics provider and measurement ID (only with consent) | No                        |
| 10.7 | Preferred default title/description                       | No — drafted for approval |
| 10.8 | Social handle for Twitter cards                           | No                        |
| 10.9 | Existing content/URLs to preserve or redirect             | If replacing a site       |

No ratings, reviews, prices, opening hours, addresses or credentials are added to structured data until verified.

---

## 11. Accounts, hosting and access

The brief specifies GitHub, Render, MongoDB Atlas and Cloudinary. The clinic should own these accounts and invite the developer as a collaborator. Never share passwords in chat.

| #     | Needed                                                             | Blocker?               |
| ----- | ------------------------------------------------------------------ | ---------------------- |
| 11.1  | GitHub repository/org and collaborator invite                      | Yes                    |
| 11.2  | Render account/workspace, billing plan choice, collaborator invite | Yes                    |
| 11.3  | MongoDB Atlas project + dedicated database user (secure handoff)   | Yes                    |
| 11.4  | Cloudinary cloud name + API key/secret (secure handoff)            | Yes                    |
| 11.5  | Domain registrar/DNS access or delegate                            | Yes, for custom domain |
| 11.6  | Email notification provider or SMTP credentials                    | Yes, for email alerts  |
| 11.7  | 2FA/recovery ownership confirmation                                | Yes                    |
| 11.8  | Production admin name/email for the first owner account            | Yes                    |
| 11.9  | Approval contact for content and deployment sign-off               | Yes                    |
| 11.10 | Billing limits / Cloudinary plan expectations                      | Recommended            |

---

## 12. Approval workflow

1. **Brand direction** — approve palette, typography and art direction (or request changes).
2. **Content** — clinic supplies/approves treatment, team, FAQ and legal copy.
3. **Medical/legal review** — clinic confirms all public claims are accurate and compliant.
4. **UAT** — clinic tests the admin dashboard and public forms on a development/staging environment.
5. **Deployment approval** — explicit written approval immediately before Phase 10.

Until approval, all unverified content remains unpublished or clearly marked as development-only.

---

## 13. What the developer will not invent

- Phone numbers, WhatsApp numbers, emails, addresses, opening hours or map locations.
- Treatment names, prices, durations, outcomes, suitability or precautions.
- Doctor/practitioner names, qualifications, registrations or experience.
- Testimonials, star ratings, client counts or “years of experience” statistics.
- Awards, certifications, medical badges or guarantees.
- Before/after photographs or claims.
- Legal policy wording presented as legal advice.
- A domain name or hosting account ownership.

If any required item is missing at launch, the related feature stays hidden, disabled or explicitly labelled as pending — never fabricated.
