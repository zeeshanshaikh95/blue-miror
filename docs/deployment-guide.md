# Blue Miror — Deployment Guide

> Nothing in this repository has been deployed. This guide documents the verified
> build outputs and the exact steps an operator must take. Placeholders such as
> `blue-miror.example.com` must be replaced with the real approved domain.

## 1. Topology

```
Browser
  ├── static SPA  ── GitHub Pages (client/dist)        https://<domain>
  └── XHR /api/*  ── Render web service (server)       https://api.<domain>/api
                        └── MongoDB Atlas cluster
                        └── Cloudinary (server-side uploads only)
```

The client calls the API through `VITE_API_BASE_URL` and sends credentials with
`credentials: 'include'`; the server only accepts origins listed in
`CORS_ORIGINS`.

## 2. MongoDB Atlas

1. Create a dedicated project and a `blue-miror-production` cluster; do not reuse
   any other project's cluster.
2. Create a database user with `readWrite` on the `blue_miror` database only.
3. Network access: allow the Render egress addresses (or `0.0.0.0/0` only if the
   provider offers no static egress; prefer IP allowlisting).
4. Copy the SRV connection string into `MONGODB_URI` on Render.
5. Indexes are created by Mongoose at startup (`autoIndex` is enabled outside
   production; run the same index build once in production or enable it for the
   first boot). Verify indexes exist on `sessions`, `appointments`, `enquiries`,
   `contactmessages`, `testimonialsubmissions` and `services`.

## 3. Cloudinary

1. Create a Cloudinary account dedicated to Blue Miror. Do not reuse Glow by
   Parveen or Herb & Hue credentials.
2. Note the cloud name, API key and API secret.
3. Allowed folders are fixed in `server/src/config/cloudinary.ts`
   (`CLOUDINARY_FOLDERS`) and every public ID must start with `blue-miror/`.
4. Uploads go through `POST /api/admin/uploads`; no unsigned browser preset is
   used and the API secret never reaches the client.
5. Image delivery: the client consumes the stored `secure_url`. For responsive
   delivery, insert Cloudinary transformation segments (`f_auto,q_auto,w_…`) when
   wiring real photography; the current placeholder imagery is vector, not
   photographic.

## 4. Render (API)

- Runtime: Node 22. Build: `npm ci && npm run build --workspace server`.
  Start: `npm run start --workspace server` (or `node server/dist/index.js`).
- Health check path: `/api/health` (returns `{status:"ok"}`; `503` when a
  required dependency is degraded).
- Required environment variables:

| Variable                                                               | Notes                                               |
| ---------------------------------------------------------------------- | --------------------------------------------------- |
| `NODE_ENV=production`                                                  | Enables strict production validation                |
| `MONGODB_URI`                                                          | Atlas SRV string, database `blue_miror`             |
| `JWT_SECRET`                                                           | ≥ 48 random bytes, base64 or hex                    |
| `ADMIN_LOGIN_EMAIL`, `ADMIN_LOGIN_PASSWORD`                            | Bootstrap credentials, ≥ 12 characters              |
| `ADMIN_BOOTSTRAP_SECRET`                                               | One-time bootstrap token, ≥ 32 characters           |
| `CORS_ORIGINS`                                                         | Exact client origin(s), comma separated, https only |
| `PUBLIC_SITE_URL`                                                      | Canonical public origin, used in generated links    |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media uploads                                       |
| `TRUST_PROXY=1`                                                        | Only when behind the provider proxy                 |
| `LOG_LEVEL`                                                            | `info` in production                                |

Production validation rejects: `NODE_ENV=production` with `http://` CORS origins,
a short `JWT_SECRET`, wildcard CORS, or missing Mongo/Cloudinary values that the
feature set requires. The server fails fast rather than starting misconfigured.

## 5. GitHub Pages (client)

1. Build with the deployment values:

```bash
cd client
VITE_API_BASE_URL="https://api.<domain>/api" \
VITE_SITE_URL="https://<domain>" \
VITE_ALLOW_INDEXING="false" \
npm run build
```

`npm run build` runs `tsc --noEmit`, `vite build`, then
`scripts/generate-seo.mjs`, which writes `dist/robots.txt`, `dist/sitemap.xml`, a
metadata shell per public route (`dist/about/index.html`,
`dist/treatments/index.html`, `dist/treatments/<slug>/index.html`, …) and
`dist/404.html`. Each shell carries that route's `<title>`, description, canonical
and Open Graph/Twitter tags. Admin routes are never emitted.

2. Vite `base` must match the GitHub Pages path. For a project site
   (`https://<user>.github.io/blue-miror/`) set `base: '/blue-miror/'` in
   `client/vite.config.ts`; for a user/apex site keep `/`.
3. Publish `client/dist`. Do not publish source, `.env` files or source maps
   (`build.sourcemap` stays `false`).
4. **SPA deep links.** GitHub Pages has no rewrite. `scripts/generate-seo.mjs`
   copies `index.html` to `404.html` during the build, so unknown paths boot the
   SPA and React Router renders the correct route (or the 404 page). Verify
   `dist/404.html` exists in the published output; without it a direct hit on
   `/treatments/<slug>` returns GitHub's 404.
5. **SEO caveat — metadata shells, not prerendering.** `robots.txt`,
   `sitemap.xml` and the per-route metadata shells are real files, so link
   previews and crawlers that read `<head>` without running JavaScript get the
   correct title, description and canonical. The page **body** is still rendered
   by React in the browser: a non-executing crawler sees an empty shell, and the
   sitemap is only a list of URLs, not rendered content. Body prerendering was
   assessed and rejected because the client is a `BrowserRouter` SPA whose data
   comes from TanStack Query against a live API and whose `<head>` values are set
   by runtime effects; prerendering it would need a headless-browser build pass
   against a running API or a framework migration. If full prerendering becomes a
   launch requirement, the supported alternative is to render the public routes
   at build time with a headless browser against the production API and publish
   those files in place of the shells (or move to a framework with route-level
   data loading). Treatment shells are written only when `VITE_API_BASE_URL` is
   reachable at build time; otherwise the build logs a warning and the static
   routes still get their shells.
6. Keep `VITE_ALLOW_INDEXING` unset/false until clinic content and legal pages are
   approved; the generated `robots.txt` then disallows everything. `/admin/*` is
   always disallowed.

## 6. Custom domain and DNS

| Record      | Name       | Value                                    |
| ----------- | ---------- | ---------------------------------------- |
| `A`/`ALIAS` | `<domain>` | GitHub Pages addresses (per GitHub docs) |
| `CNAME`     | `www`      | `<user>.github.io`                       |
| `CNAME`     | `api`      | Render service hostname                  |

- Enable HTTPS on both hosts and force redirects.
- Add the `CNAME` file for GitHub Pages if using a custom apex domain.
- After DNS is live, set `PUBLIC_SITE_URL` and `CORS_ORIGINS` to the final
  origins, rebuild the client with the same `VITE_SITE_URL`, and regenerate the
  sitemap.

## 7. Cross-origin authentication constraint (unresolved by design)

Admin sessions are held in memory and authorized with a short-lived JWT plus a
persisted session row. A `*.github.io` + `*.onrender.com` pair is cross-site:
cookies would need `SameSite=None; Secure` and third-party-cookie support, which
browsers are actively restricting. The current design avoids cookies entirely —
callers send `Authorization: Bearer <token>` — which works cross-site but means a
page reload requires signing in again.

If persistent sessions matter, host the client and API under one registrable
domain (for example `app.<domain>` and `api.<domain>`) and implement the
httpOnly refresh-cookie flow described in the implementation plan.

## 8. Launch checklist

- [ ] Atlas cluster, user, allowlist, backups enabled.
- [ ] Cloudinary account, folders, upload smoke test with a real image.
- [ ] Render service healthy at `/api/health`.
- [ ] Bootstrap admin created; bootstrap secret rotated/removed afterwards.
- [ ] `CORS_ORIGINS` matches the live client origin exactly.
- [ ] Client built with production `VITE_*` values; `404.html` present.
- [ ] Deep link on a treatment page loads correctly.
- [ ] `dist/about/index.html` and a treatment shell contain the expected
      `<title>`/canonical (view source, not the rendered DOM).
- [ ] `robots.txt` / `sitemap.xml` reflect launch indexing decision.
- [ ] Clinic content approved: phone, WhatsApp number, address, hours, team,
      treatment copy, legal pages, testimonial consent.
- [ ] Booking request submitted end to end; WhatsApp message opens prefilled with
      the configured number; request visible in the admin inbox as `pending`.
- [ ] Backup and restore rehearsed once.

## 9. Rollback

Render keeps previous deploys — redeploy the last good build. GitHub Pages keeps
the prior commit's build — re-run the workflow from the last good commit. Data
rollback uses Atlas snapshots; there are no destructive migrations in this
codebase (all schema additions are optional with defaults).
