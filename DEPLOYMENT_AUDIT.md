# Production Deployment Audit: YojanaBundle

## Summary
- **Overall readiness:** Not ready
- **Findings by severity:**
  - **BLOCKER:** 5
  - **HIGH:** 5
  - **MEDIUM:** 3
  - **LOW:** 3
  - **Total findings:** 16

---

## Findings table

| # | Severity | Area | File:Line | Problem | Why it breaks in production | Suggested fix (one line, no code changes made) |
|---|---|---|---|---|---|---|
| 1 | BLOCKER | Git Hygiene / Deployment | `.git/HEAD:1` | Local branch `main` is 7 commits behind `origin/main` (`f981756` vs `e73d454`). | Deploying from local working tree deploys obsolete code missing SQLite authentication, SQLAlchemy DB models, and backend security fixes. | Fast-forward local branch with `git pull origin main` before building or configuring deployment targets. |
| 2 | BLOCKER | Backend Production Readiness | `backend/main.py:267` | Server execution binds to `127.0.0.1:8000` with `reload=True` hardcoded. | Cloud PaaS and Docker containers cannot route external ingress to loopback `127.0.0.1` and require dynamic `$PORT` binding. | Bind uvicorn to `0.0.0.0`, read `int(os.environ.get("PORT", 8000))`, and disable `reload` in production. |
| 3 | BLOCKER | Build, Run & Deploy Artifacts | `backend/main.py:1` | Missing `Dockerfile`, `Procfile`, `render.yaml`, `railway.json`, and `vercel.json`. | Cloud hosting platforms have no build/start configuration for the Python FastAPI backend and Vite frontend. | Create a backend `Procfile` / `Dockerfile` and a frontend deployment configuration file (e.g., `vercel.json`). |
| 4 | BLOCKER | Persistence / Ephemeral Filesystem | `backend/main.py:41, 242-263` | Feedback is appended to local `feedback_log.json` without file locking or database storage. | Ephemeral container filesystems wipe file on restart, concurrent writes cause data loss, and read-only filesystems crash. | Migrate feedback entries to SQLite/PostgreSQL or mount a persistent volume and enforce atomic file locking. |
| 5 | BLOCKER | Environment Variables & Secrets | `backend/main.py:43` & `origin/main:backend/auth_utils.py:12` | Hardcoded JWT secret on local `main` and insecure fallback default on `origin/main`. | Anyone can forge valid administrative or user JWT tokens, compromise all user sessions, and bypass authentication. | Enforce `JWT_SECRET` from environment variables and raise an exception on startup if missing. |
| 6 | HIGH | Hardcoded Localhost / URLs & Security | `backend/main.py:28-35` | CORS `allow_origins` includes `"*"`, localhost URLs, and sets `allow_credentials=True`. | Browsers reject credentialed requests with wildcard origins, and production frontend domain cannot access API. | Configure `allow_origins` from a `CORS_ORIGINS` environment variable and remove wildcard `"*"`. |
| 7 | HIGH | Persistence / Ephemeral Filesystem | `origin/main:backend/db.py:6-15` | `create_engine` hardcodes SQLite-specific connect args and executes `PRAGMA journal_mode=WAL`. | If `DATABASE_URL` is set to PostgreSQL on cloud hosts, connecting to the database crashes immediately. | Apply `check_same_thread` and SQLite WAL event listener only when `DATABASE_URL` starts with `sqlite`. |
| 8 | HIGH | Hardcoded Localhost / URLs & Frontend Readiness | `frontend/vite.config.js:10-15`, `frontend/src/App.jsx:69, 125` | Frontend makes relative `/api/...` calls relying on Vite dev proxy (`127.0.0.1:8000`). | Vite proxy does not run on production static CDN hosts (Vercel/Netlify), causing all API calls to 404. | Prepend `import.meta.env.VITE_API_BASE_URL || ''` to all API calls or add host rewrite rules. |
| 9 | HIGH | Git Hygiene & Security | `.gitignore:63-65` | `.gitignore` omits `*.db` and `*.sqlite3`, leaving `backend/data/users.db` untracked. | Developers running `git add .` risk committing live user databases and password hashes to public repositories. | Add `*.db`, `*.sqlite`, and `*.sqlite3` to `.gitignore`. |
| 10 | HIGH | Backend Production Readiness & Security | `backend/main.py:68-78` | Global 500 error handler outputs raw exception string (`"detail": str(exc)`). | Leaks internal database schema, file paths, and stack trace information to untrusted clients. | Return a sanitized generic message in 500 responses and log the raw traceback with Python `logging`. |
| 11 | MEDIUM | Backend Production Readiness | `backend/requirements.txt:4` | `pandas>=2.0.0` is specified in dependencies but never imported in backend code. | Bloats container build times and image sizes by >100MB, increasing build failure risk on free tiers. | Remove `pandas` from `backend/requirements.txt`. |
| 12 | MEDIUM | Backend Production Readiness | `origin/main:backend/requirements.txt:11-12` | `slowapi` and `filelock` are in dependencies but never wired into `main.py`. | Authentication routes remain unprotected against brute-force attacks, and JSON writes remain unprotected. | Implement `slowapi` rate limiting on `/api/auth/*` routes and use `filelock` on JSON writes. |
| 13 | MEDIUM | Data Files | `backend/data/schemes.json:1` & `origin/main:backend/data/schemes.json:1` | `origin/main` has 8 schemes populated, falling below the required 12-15 scheme target. | App recommendation bundles provide an incomplete scheme set to users in production. | Populate additional vetted agricultural schemes in `schemes.json` to meet the 12-15 scheme target. |
| 14 | LOW | Security Quick Pass | `backend/main.py:19-23` | Swagger UI (`/docs`) and OpenAPI schema (`/openapi.json`) are exposed unconditionally. | Exposes complete internal API schema and endpoint definitions to external vulnerability scanners. | Set `docs_url=None, redoc_url=None, openapi_url=None` when `ENVIRONMENT == "production"`. |
| 15 | LOW | Backend Production Readiness | `backend/requirements.txt:1` | Repository lacks a `runtime.txt` or `.python-version` file. | Cloud buildpacks default to unexpected Python versions (e.g. 3.12+), risking build incompatibilities. | Add `runtime.txt` specifying `python-3.10.10` or configure the Python version in build settings. |
| 16 | LOW | Backend Production Readiness | `backend/models.py:6, 9, 10, 13` | Numeric profile fields (`annual_income`, `age`, `land_acres`) lack minimum boundary checks. | Malformed client payloads (e.g. negative income or age) can produce invalid scoring calculations. | Add Pydantic field constraints (`ge=0` and upper bounds) to profile model attributes. |

---

## Verified OK
- **Frontend Production Build:** Executed `npm run build` inside `frontend/` directory; completed with exit code 0 (`vite v5.4.21` produced `dist/index.html` 1.05 kB, `dist/assets/index-BWSKrzpm.css` 55.81 kB, `dist/assets/index-ChdTSvXd.js` 440.75 kB).
- **Backend Health Check Route:** `GET /api/health` is implemented and returns 200 OK with service identifier and version (`backend/main.py:90-92`).
- **Data Cleaner & Sanitizer:** Scheme data sanitization pipeline correctly normalizes strings, cleans broken encodings via `ftfy`, and validates deadline days (`backend/services/data_cleaner.py:1-111`).
- **Filepath Independence for Schemes:** Scheme dataset path is constructed using `os.path.join(os.path.dirname(__file__), "data", "schemes.json")`, preventing failure from arbitrary working directories (`backend/main.py:40`).
- **ORM Password Hash Isolation:** `origin/main:backend/models_db.py:38-46` explicitly excludes `password_hash` from the `to_dict()` serialization method.
- **Bcrypt Salt & Truncation:** Password hashing in `origin/main:backend/auth_utils.py:16-22` generates individual salts and bounds plaintext input to 72 bytes.
- **Component File-Casing Consistency:** All JSX imports in `frontend/src/App.jsx:2-23` exactly match file casing on disk.
- **Parameterized Database Queries:** User lookups in `origin/main:backend/main.py:126, 150` utilize SQLAlchemy ORM filters without raw SQL string concatenation.

---

## NOT VERIFIED
- **Live PostgreSQL Connection:** Could not verify runtime query behavior and transaction semantics on PostgreSQL since no live remote database instance was connected.
- **High-Concurrency Feedback Write Contention:** Could not verify race condition failure rates under high parallel load on `feedback_log.json`.
- **Production SSL/TLS Termination:** Cloud provider reverse proxy SSL header forwarding (`X-Forwarded-Proto`, HTTPS redirection) cannot be verified in local dev environment.
- **Container Network Latency & Cold Start:** Cold start response times on serverless or idle-sleep PaaS instances (Render free tier) could not be benchmarked without live deployment.

---

## Recommended fix order
1. **Sync Git State:** Run `git pull origin main` to synchronize local `main` with `origin/main` commits.
2. **Add Missing Deploy Artifacts:** Create `backend/Dockerfile` (or `Procfile`) and a frontend hosting configuration (`vercel.json` or Netlify `_redirects`).
3. **Fix Server Host, Port, and Reload:** Update backend runner to bind `0.0.0.0`, read `$PORT`, and disable `reload` in production.
4. **Harden Secrets & Environment Variables:** Enforce required `JWT_SECRET` from environment variables without default fallback strings.
5. **Fix CORS & Credentials:** Configure `CORSMiddleware` using a configurable `CORS_ORIGINS` environment variable and remove wildcard `"*"`.
6. **Decouple Frontend API URL:** Update frontend fetch calls to prepend `import.meta.env.VITE_API_BASE_URL` or configure proxy rewrites.
7. **Fix Database & Ephemeral Storage:** Add database URL dialect detection in `db.py` to support PostgreSQL and migrate feedback writes to DB.
8. **Update Git Ignore Rules:** Add `*.db`, `*.sqlite`, and `*.sqlite3` to `.gitignore`.
9. **Sanitize Exception Responses & Add Rate Limiting:** Replace 500 error exception disclosure with generic message and activate `slowapi`.
10. **Clean Dependencies & Expand Schemes:** Remove unused `pandas` from `requirements.txt` and populate schemes to reach the 12-15 target.

---

## Recommended hosting approach
- **Frontend:** Deploy to **Vercel** or **Cloudflare Pages** (free, global edge CDN, zero maintenance for static Vite build output).
- **Backend + Database:** Deploy to **Render** (Web Service + Managed PostgreSQL Free Tier) or **Railway**.
- **Reasoning:** The app requires persistent storage for user accounts, saved profiles, and feedback logs. Free hosting tiers use ephemeral filesystems where local SQLite and JSON files are erased on restart/deploy; using a managed PostgreSQL database with dialect-aware SQLAlchemy configuration ensures data persistence without requiring paid persistent volume mounts.

---

## Commands run
- `git status`
- `Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch '\\(node_modules|\.git|venv|\.venv|dist|build|__pycache__)\\' } | Select-Object -ExpandProperty FullName`
- `git log -n 5 --oneline`
- `git check-ignore -v backend/.env`
- `git log -p --all -- "**/.*env*" "*env*"`
- `git log -n 5 --stat`
- `git log main..origin/main --oneline`
- `git diff main origin/main --stat`
- `git show origin/main:backend/requirements.txt`
- `git log -1`
- `git show origin/main:backend/main.py`
- `git show origin/main:backend/auth_utils.py`
- `git show origin/main:backend/db.py`
- `git grep "/api" origin/main`
- `git grep -n -E "localhost|127\.0\.0\.1|:8000|:3000|http://|ws://"`
- `git grep -n -E "localhost|127\.0\.0\.1|:8000|:3000|http://|ws://" origin/main`
- `git grep -n -E "getenv|environ|import\.meta\.env|process\.env"`
- `git grep -n -E "getenv|environ|import\.meta\.env|process\.env" origin/main`
- `git log -p -S "yojana_bundle_jwt_secret_key_prod_2026_secure"`
- `git grep -h -E "^(import|from) " -- "backend/*.py" "backend/services/*.py"`
- `git grep "pandas"`
- `git grep -n -E "slowapi|filelock|rate_limit" origin/main`
- `Get-ChildItem -File -Path . -Include "runtime.txt", ".python-version", "pyproject.toml" -Recurse`
- `python --version`
- `npm run build` (in `frontend/`)
- `git grep -n "console\." frontend/src`
- `python -c "import json; data=json.load(open('backend/data/schemes.json', encoding='utf-8')); print('Local schemes count:', len(data))"`
- `python -c "import json, subprocess; out = subprocess.check_output(['git', 'show', 'origin/main:backend/data/schemes.json']); data = json.loads(out.decode('utf-8')); print('origin/main schemes count:', len(data))"`
- `Get-ChildItem -File -Path . -Include "Procfile*", "Dockerfile*", "docker-compose*", "*render*", "*railway*", "*vercel*", "*netlify*", "*.workflow*" -Recurse`
- `git ls-files` (size audit)
- `Get-ChildItem -File -Path . -Include "*.sh", "*.bat", "*.cmd", "*.ps1" -Recurse`
- `git show origin/main:backend/models_db.py`
