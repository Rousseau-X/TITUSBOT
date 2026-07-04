---
name: BotDash Postgres migration
description: Notes on the switch from the hand-rolled JSON-file "SQL" shim to real Replit PostgreSQL for the BotDash server.
---

`server/db.js` used to be a hand-rolled synchronous fake `better-sqlite3` API backed by JSON files under `data/` (regex-parsed SQL, `?` placeholders). It has been replaced with a real `pg` Pool against Replit's managed Postgres (`DATABASE_URL`).

**Why:** user explicitly asked to stop using a file-based/SQLite-like store and use Replit's built-in Postgres (free tier) instead, ahead of publishing.

**How to apply:**
- All `server/routes/*.js`, `server/middleware/auth.js`, and `server/botManager.js` are now `async` and use `$1,$2...` parameterized queries via `db.query(sql, params)`, not the old synchronous `db.prepare(sql).get/all/run()` API. Any new route code must follow the async pattern.
- Schema is created idempotently by `db.initSchema()` on server boot (`CREATE TABLE IF NOT EXISTS`), not via manual migration scripts — consistent with the platform rule that production schema changes are handled by the Publish flow, not agent-written migrations.
- Old JSON data (`data/*.json`) was migrated once into Postgres and archived to `data_backup_json/` — duplicate-email user rows from old buggy re-registrations were deduped (kept most recent per email) and bot `user_id` FKs remapped accordingly.
- In production, `server.js` serves the built `dashboard/dist` static files and falls back to `index.html` for non-`/api` routes so the whole app runs as a single Node process (needed for a single-port autoscale deployment). Deployment is configured as `autoscale` with build `npm run build --prefix dashboard` and run `NODE_ENV=production node server.js`.
