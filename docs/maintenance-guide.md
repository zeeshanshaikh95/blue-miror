# Blue Miror — Maintenance Guide

## 1. Routine checks

| Cadence           | Task                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| Daily             | Review pending inbox items; confirm the API health endpoint is green   |
| Weekly            | Check Render logs for 5xx responses, rate-limit hits and auth failures |
| Monthly           | `npm audit` review, dependency patch updates, Atlas metric review      |
| Quarterly         | Restore a backup into a scratch database and verify it                 |
| On content change | Re-check the affected public page within ~60 s of saving               |

## 2. Backups and recovery

- **MongoDB Atlas**: enable cloud backups (continuous or daily snapshots,
  retention per plan). Record the restore procedure and test it at least once.
- **Manual export** before risky work:

```bash
mongodump --uri "$MONGODB_URI" --archive=blue-miror-$(date +%F).archive --gzip
mongorestore --uri "$MONGODB_URI" --archive=blue-miror-YYYY-MM-DD.archive --gzip
```

- **Cloudinary**: assets live in the `blue-miror/` folder. Keep a copy of approved
  original photography outside Cloudinary; deleted assets are not recoverable
  from the application.
- **Secrets**: store environment values in the hosting provider's secret store and
  in a password manager. Losing `JWT_SECRET` only invalidates sessions; losing
  `ADMIN_LOGIN_PASSWORD` requires a re-bootstrap with a new bootstrap secret.

## 3. Dependency and platform updates

1. Read the advisory or changelog first.
2. Update one dependency group at a time; keep the lockfile in the change.
3. Run all five gates in both workspaces.
4. Deploy to a staging origin before production.
5. Never run `npm audit fix --force` on this codebase — it will introduce breaking
   major upgrades.

Node version: the project targets Node 22. Bumping the runtime requires a full
gate run and a check of `mongodb-memory-server` compatibility for tests.

## 4. Security operations

- Rotate `JWT_SECRET` to sign out every session at once (all tokens become
  invalid). No data is affected.
- Rotate `ADMIN_BOOTSTRAP_SECRET` after every bootstrap.
- Rotate Cloudinary keys in the provider dashboard, then update the API env and
  redeploy; uploads return `503` until both match.
- Password changes self-invalidate: the server compares the session's issue time
  with `passwordUpdatedAt` and revokes all sessions on change.
- Review `CORS_ORIGINS` whenever the domain changes. Wildcards are rejected in
  production.
- Uploaded files are validated by magic bytes, size and folder; if abuse appears,
  tighten `MAX_UPLOAD_BYTES` and the route rate limits.

## 5. Monitoring and logging

- Logs are structured JSON via pino; authorization headers and cookies are
  redacted. Set `LOG_LEVEL=info` in production.
- An audit collection records every administrative write plus sign-in success,
  sign-in failure, sign-out and password change. Read it at
  `GET /api/admin/audit` (admin token required; `page`, `limit`, `action`
  filters). Entries store actor, action, method, path, status, entity and request
  ID only — never bodies, credentials, tokens or customer messages — and expire
  after one year. The collection relies on the MongoDB TTL monitor; no manual
  pruning is needed.
- Each error response carries a request ID that matches the log entry — ask the
  reporter for it when investigating.
- Watch for: repeated `401` from one IP (credential stuffing), `429` spikes on
  submission routes (bot traffic), `500` on `/api/public/*` (database issues),
  and `MEDIA_UNAVAILABLE` (Cloudinary misconfiguration).

## 6. Content governance

- Placeholder content is marked in the UI. Replace it only with clinic-approved
  wording; never invent services, prices, durations, credentials, reviews or
  results.
- Testimonials require recorded consent; when in doubt, leave them unpublished.
- Keep the legal pages' "last updated" date accurate.
- If a treatment is withdrawn, unpublish it rather than deleting it, so historical
  bookings and enquiries still resolve.

## 7. Known limitations to keep in mind

- Admin sessions are not persisted across reloads (cross-origin design).
- Browser/axe automated QA is not part of the repo; run it before major releases.
- The static client is client-rendered. The build emits per-route metadata
  shells, sitemap and robots, but no page bodies are prerendered (see
  `deployment-guide.md` §5.5).
- The media uploader needs Cloudinary credentials on the API; without them the
  dashboard shows the `503 MEDIA_UNAVAILABLE` error. Manual public-ID entry
  remains available for assets uploaded elsewhere.
- The audit log has no dashboard screen yet; query the API directly.
