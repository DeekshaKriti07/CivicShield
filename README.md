# CivicShield

CivicShield records civic incident reports, prepares assessments for review, and stores operator decisions. The React interface and FastAPI API run on one origin.

## What works

- Reporter registration, sign in, server-side session expiry, and sign out with session revocation.
- Report creation with validated coordinates, paginated records, and individual report history.
- Reporters can access their own reports. Operators can review all reports.
- Keyword classification and rule-based scoring work without an AI provider. Optional Ollama output is schema-validated and falls back to labeled rules when unavailable.
- Saved assessments include the classification source, rule score factors, suggested department, and draft plan. Approval is required before recording an internal assignment. A resolution requires an operator note.

No external dispatch, image verification, sensor monitoring, evidence fusion, or password recovery is connected. Internal assignment does **not** notify a team or contact emergency services. A saved resolution is an operator statement, not a sensor measurement. AI confidence percentages, fabricated reports, testimonials, and marketing metrics are not displayed. No facility directory is assumed to be verified or complete.

## Run locally

Use Python 3.12 and Node 24 (minimum 22.12).

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
cp .env.example .env
npm --prefix frontend ci
npm --prefix frontend run build
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. New accounts have the REPORTER role. Provision a separate operator from a trusted shell; the password is entered privately and is never a command-line argument:

```bash
python -m backend.manage your-operator-name
```

For frontend development, run `npm --prefix frontend run dev` in another terminal. Vite proxies `/api` to the local backend. The production frontend deliberately uses the same origin and ignores the old `VITE_API_BASE_URL` variable.

## Authentication and access

Passwords use PBKDF2-SHA256 at 600,000 rounds. Existing PBKDF2 password hashes remain readable. Sessions use random opaque cookies; only token hashes are stored in the database. Production requires Secure, HttpOnly, SameSite=Strict cookies. The browser does not store bearer tokens. Cookies expire after eight hours by default; logout invalidates the database record immediately. Repeated login and registration requests are rate-limited through database records shared across workers.

Mutating API requests require `X-CSRF-Protection: 1`; supplied browser origins must match the current origin or an explicit `ALLOWED_ORIGINS` entry. Production is designed for same-origin access. CORS is not a substitute for authorization. Do not enable wildcard origins. TLS must terminate at a trusted proxy; configure trusted forwarded IPs in the process server if necessary. Never trust user-supplied forwarding headers directly.

The application checks role and report ownership on the server. Public registration never creates operators. Set `REGISTRATION_ENABLED=false` if accounts are provisioned by an administrator only. There are no shared demo accounts or default passwords.

## Render deployment

The existing Python web service name is retained in `render.yaml`. Its build now includes the React frontend, and FastAPI serves the compiled assets. This removes the localhost API and cross-origin cookie configuration errors.

Before deploying:

1. Back up the existing database and confirm the target service/repository.
2. Supply a durable PostgreSQL connection string as `DATABASE_URL` in Render's Environment settings. `postgres://`, `postgresql://`, and `postgresql+psycopg://` are accepted. **No database or paid resource is provisioned by this repo.** Select a database with an appropriate persistence and backup policy; a free web process is not durable storage.
3. Set `ENVIRONMENT=production` and `COOKIE_SECURE=true`. These are declared in the Blueprint. Production refuses SQLite rather than losing accounts and reports on a redeploy.
4. Build with `pip install -r backend/requirements.txt && npm --prefix frontend ci && npm --prefix frontend run build`.
5. Start with `uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 1` and use `/health` as the health check.
6. Create an operator using the management command from a trusted environment connected to the production database. Verify login, report creation, approval, assignment, resolution, logout, and restoration from a database backup on staging before accepting operational traffic.

For an existing Render service, `sync: false` does not populate a newly required variable on later Blueprint syncs: set `DATABASE_URL` explicitly in the dashboard. The former `SECRET_KEY` is no longer used because sessions are database-backed opaque tokens. A new deployment invalidates old browser bearer sessions; users must sign in again.

No live deployment is performed by these code changes. External dispatch remains unavailable (`POST /api/incident/{id}/dispatch` returns 503). The UI offers only internal assignment. Operational launch still requires an administrator, a durable database, backups, and service-specific acceptance checks.

## Existing data and upgrades

The existing `users` and `incidents` tables are preserved. Additive `auth_sessions`, `rate_buckets`, `incident_access`, and `incident_analysis` tables are created at startup. Back up before upgrading; the application does not copy SQLite records into a new PostgreSQL database. For existing data, perform and validate that transfer separately before switching `DATABASE_URL`.

Pre-upgrade incidents have no ownership record and are visible to operators only. They are never assigned silently to public accounts. Existing legacy analysis, approval, and dispatch statuses are preserved as historical data; no missing analysis, approver identity, or event is invented. An operator must inspect legacy records before further action.

The old unprefixed API and standalone demo screens were replaced. All application endpoints now use `/api`. There is no public incident feed. Operator records are paginated with a maximum of 200 per request.

## Optional model and facilities

Set `AI_ENABLED=true`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL` only for a model endpoint you operate. Default requests time out after 15 seconds per model step and fall back to rules. Model output is a draft for human review, not independently verified evidence. Prompts and validation cannot guarantee a model's factual accuracy.

`FACILITIES_FILE` may point to an administrator-verified JSON array of objects with `name`, `facility_type`, `latitude`, and `longitude`. Nearby facilities are considered within 500 meters, with a 200 meter critical radius. The default directory is empty; no fabricated facilities affect scoring.

## Tests

```bash
python -m pytest backend/tests -q
npm --prefix frontend run build
npm --prefix frontend test
```

Browser tests start an isolated local API and SQLite database, create test-only users, and exercise actual HTTP workflows in Chromium. Install the browser once with `cd frontend && npx playwright install chromium`. On environments with an existing Chromium executable, set `CHROMIUM_PATH=/usr/bin/chromium`.

CI runs backend tests, dependency checks, the frontend build, and browser tests. Test data and credentials belong only to the isolated test database. A passing local suite is not evidence that a live deployment or real-world response service has been tested.
