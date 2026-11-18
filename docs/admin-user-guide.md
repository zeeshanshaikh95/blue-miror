# Blue Miror — Admin User Guide

Sign in at `/admin/login`. Everything below is reachable from the left sidebar.
The dashboard is for clinic staff only; there is no public registration.

## 1. Signing in and account security

- Sign-in is rate limited. Repeated failures pause further attempts.
- Sessions are short-lived. Reloading the page signs you out; this is expected
  behaviour for the current cross-origin setup.
- **Account** → change password. Your current password is required, the new one
  must be at least 12 characters and different from the old one. Saving signs out
  every session, including yours, so sign in again.
- Never share the bootstrap secret or store it in a browser or chat.

## 2. Overview

Live counts for services, categories, gallery items, team members, testimonials,
FAQs and pending submissions. The pending badge counts appointments, enquiries,
contact messages and testimonial submissions waiting for review.

## 3. Inbox

Four tabs: **Appointments**, **Enquiries**, **Contact messages**, **Testimonials**.

- Search matches names, phone numbers, emails and messages.
- Filter by status and by a from/to date range (whole days, clinic timezone).
- Lists are paginated; totals reflect the active filters.
- Open a record to see full details, internal notes, status history and the
  WhatsApp handoff link.
- Status changes are recorded in the history with an actor and timestamp.
  `pending` is the only initial state for a new request — nothing becomes
  `confirmed` unless a member of staff changes it.
- Testimonials appear only after explicit customer consent; publishing requires a
  deliberate action and the customer's name is shown exactly as submitted
  (or initials, per their choice).

Internal metadata (IP hash, user agent, consent bookkeeping) is not shown in the
public API and must not be quoted back to customers.

## 4. Services

Create, edit, publish/unpublish (via the published date) and archive.

| Field                   | Notes                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| Service name            | Shown in listings and on the detail page                                   |
| Slug                    | URL segment; changing it changes the public URL                            |
| Category                | Must exist first                                                           |
| Visual style            | Placeholder art direction until real photography is approved               |
| Short description       | Listing card copy                                                          |
| Overview                | One paragraph per line                                                     |
| Procedure steps         | One step per line                                                          |
| Benefits                | One benefit per line                                                       |
| Considerations          | One consideration per line                                                 |
| Price                   | Optional. Leave blank unless the clinic has approved the wording           |
| Duration                | Optional, free text (for example "45 minutes")                             |
| SEO title / description | Optional overrides for the public page metadata                            |
| Related services        | Slugs of other treatments to cross-link; a service cannot relate to itself |
| Image                   | Upload or replace through the media field, plus descriptive alt text       |

Featured services appear on the homepage. Ordering is stored server-side
(`order`, then featured, then name); the reorder endpoint exists
(`PATCH /api/admin/services/reorder`) but has no drag-and-drop UI yet.

Optional fields left blank are stored as empty values and are not displayed
publicly — the site never fills them with invented copy. Existing records stay
valid: every new field is optional.

Never enter treatment claims, prices, durations, qualifications or outcomes that
the clinic has not approved in writing. Leaving a field empty is correct when the
information is unknown — the public site does not invent values.

## 5. Categories

Create, edit and archive. A category cannot be archived while services still
reference it; the dashboard blocks the action and reports how many services use
it. Counts come from the database, not from cached client state.

## 6. Gallery

Each item needs a title, category, alt text, image and visual style.

Use the image field to upload a file (JPEG, PNG or WebP, up to 5 MB). The upload
shows progress, then a preview of the stored image. Replacing an image uploads
the new file and then removes the old asset from Cloudinary; deleting an item
removes its asset after a confirmation step. If an asset already exists in the
Blue Miror Cloudinary account, you can still type its public ID by hand.

Before-and-after imagery must only be added with documented patient consent, and
must never imply guaranteed results.

## 7. Team

Name, role/designation, biography and a profile image. Upload or replace the photo
with the same media field used by the gallery. Only publish qualifications and
registrations that the clinic has verified and supplied.

## 8. Testimonials and FAQs

- Testimonials: review the submitted text, verify consent, then publish or
  reject. Never rewrite a customer's words into a stronger claim.
- FAQs: question/answer pairs; answers should mirror what the clinic actually
  tells patients.

## 9. Website settings

One page, several panels:

- **Identity** — clinic name, category, tagline, default description, logo URL.
- **Contact** — phone, email, WhatsApp display, address, map/directions links,
  business hours. Empty fields hide the corresponding public element.
- **WhatsApp** — enable switch, country code, number, default message, booking and
  enquiry templates, CTA labels, and the floating-button toggle. Every WhatsApp
  button on the site reads this one configuration; nothing is hardcoded.
- **Booking** — accept new requests toggle, response expectation, guidance note.
- **Social links** — label/URL pairs.
- **SEO** — default title, default description, canonical base URL.
- **Legal** — last-updated date and note for policy pages.
- **Homepage** — hero heading, description, image URL, CTA label and destination,
  introduction heading/body, and visibility for the featured treatments, gallery
  and FAQ sections. Blank fields keep the designed copy.

The former "footer note" field, and the `showTeam` / `showTestimonials` toggles,
were removed: no part of the website read them, so changing them had no effect.

Public content is cached for about 60 seconds, so changes appear shortly after
saving rather than instantly.

The floating WhatsApp button and every WhatsApp link disappear automatically when
WhatsApp is disabled or the number is invalid — that is correct behaviour, not a
bug.

## 10. Media endpoints (for technical staff)

`POST /api/admin/uploads` accepts one image (`file` field) plus a `folder` key from
the fixed list, and returns `{url, publicId, width, height, bytes, format}`.
`DELETE /api/admin/uploads` removes an asset by public ID. Both require an admin
token and refuse assets outside the `blue-miror/` prefix. Limits: 5 MB, JPEG/PNG/
WebP only (GIF and SVG are rejected because of script risk), filenames are
regenerated server-side. The dashboard uploader calls exactly these endpoints; no
Cloudinary credentials or upload preset exist in browser code.

## 10a. Audit log (API only)

Every administrative write (services, categories, gallery, team, testimonials,
FAQs, settings, media, booking status changes), plus sign-in success, sign-in
failure, sign-out and password changes, is appended to an audit collection. Entries
hold the actor, action, method, path, response status, entity and request ID — never
request bodies, passwords, tokens or customer messages. `GET /api/admin/audit`
returns them newest-first with `page`, `limit` and `action` filters; entries expire
after one year. There is no dashboard screen for it yet — query it with an admin
token.

## 11. Housekeeping

- Archive rather than delete where possible; archived records stop appearing
  publicly but keep their inbox history.
- Review pending submissions daily — customers are told the clinic responds
  during business hours.
- Update the legal "last updated" date whenever policy text changes.
