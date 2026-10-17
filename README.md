# YojanaBundle 🌾

> **Smart Eligibility Matcher & Scheme Bundling Planner for Farmers in India**

YojanaBundle is an intelligent, rules-based web application designed to help small, marginal, and commercial farmers across India discover, evaluate, and bundle government agricultural welfare schemes.

---

## ✨ Features

- **🎯 Smart Rule Matching Engine**: Evaluates farmer profiles against central and state agricultural schemes using dynamic predicates (income, land size, age, category, domicile state, documents).
- **📑 Document Overlap & Efficiency Analysis**: Maps required vs. owned documents to identify high-leverage certificates (e.g., *7/12 Extract*, *Aadhaar*, *Income Certificate*) that unlock multiple schemes simultaneously.
- **⚠️ Mutual Exclusion & Conflict Detection**: Identifies mutually exclusive schemes (e.g., choosing between competing irrigation or equipment subsidies) to prevent disqualification and optimize financial yield.
- **📊 Multi-Tier Priority Ranking**: Ranks schemes into *High*, *Medium*, and *Low* priority tiers based on composite financial benefits, urgency (deadline), and document readiness.
- **🔐 User Authentication & Profile Persistence**: Secure JWT Bearer authentication with password hashing (`bcrypt`) and persistent profile attributes stored in SQLite with WAL mode.
- **📍 CSC Locator & Action Checklist**: Step-by-step application workflow checklists and integrated Common Service Centre (CSC) office locator.
- **🌐 Multilingual Support**: Built-in support for English and regional language localization (Marathi / Hindi).

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Python 3.10+, FastAPI
- **Database**: PostgreSQL (Neon Cloud Serverless) with SQLite local fallback (WAL mode) via SQLAlchemy
- **Security**: PyJWT, bcrypt password hashing
- **Validation & Parsing**: Pydantic v2, `ftfy` (text cleanup)

### Frontend
- **Framework**: React 18, Vite 6.4+
- **Styling**: Tailwind CSS, Vanilla CSS animations
- **Icons & Animation**: Lucide React, Framer Motion, Canvas Confetti

---

## 📁 Project Structure

```text
CEP-YOJNA-BUNDLE/
├── README.md
├── PROJECT_REPORT.md
├── .gitignore
├── backend/
│   ├── main.py                  # FastAPI Application & REST Endpoints
│   ├── db.py                    # Database Connection & Engine Configuration
│   ├── models.py                # Pydantic Schemas & ProfileUpdateRequest
│   ├── models_db.py             # SQLAlchemy Models (User, Feedback, Scheme)
│   ├── seed_schemes.py          # Idempotent Database Seeder for Schemes
│   ├── auth_utils.py            # JWT Token Generation & Password Hashing
│   ├── requirements.txt         # Pinned Backend Dependencies
│   ├── data/
│   │   ├── schemes.json         # Master Scheme Seed Data & Offline Fallback
│   │   └── users.db             # Local SQLite Database (Fallback)
│   └── services/
│       ├── evaluator.py         # Dynamic Rule Evaluation Engine
│       ├── conflicts.py         # Mutual Exclusion & Scheme Conflict Detector
│       ├── overlap.py           # Document Overlap & Efficiency Matrix
│       ├── ranker.py            # Composite Priority Scoring Algorithm
│       └── data_cleaner.py      # Unicode & Text Sanitization Utility
└── frontend/
    ├── package.json             # Pinned Frontend Dependencies
    ├── vite.config.js           # Vite Server Configuration
    ├── index.html               # Main HTML Template
    └── src/
        ├── App.jsx              # Main React SPA Container
        ├── components/          # UI Components (Profile, Directory, Modals, Summary)
        ├── context/             # AuthContext Provider
        └── data/                # Presets, CSC Offices, & Translations
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: `3.10` or higher
- **Node.js**: `v18.0.0` or higher & `npm`

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed the schemes table in Neon Postgres from schemes.json
# By default, existing schemes are skipped to protect admin edits:
python seed_schemes.py

# To force overwrite existing schemes from schemes.json:
python seed_schemes.py --force

# Run the FastAPI backend server (Port 8000)
python main.py
```

The backend server will start at: `http://127.0.0.1:8000`  
Interactive API Docs (Swagger UI) available at: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (Port 3000)
npm run dev
```

The frontend application will start at: `http://localhost:3000/`

---

## 🔒 Admin Panel

YojanaBundle includes a lightweight, secure administrative panel accessible at:
```text
http://127.0.0.1:8000/admin-panel
```

### Configuration & Security:
1. **Set `ADMIN_SECRET_KEY`** in `backend/.env`:
   ```bash
   ADMIN_SECRET_KEY=your_generated_secret_token
   ```
   *Note: If `ADMIN_SECRET_KEY` is unset or empty, all admin routes (`/api/admin/*` and `/admin-panel`) return `404 Not Found` (completely disabled).*

2. **Secure Cookie-Based Session Architecture**:
   - **Login Endpoint**: `POST /api/admin/login` receives `{"key": "..."}` in the JSON body. Upon validation with constant-time comparison (`secrets.compare_digest`), it issues a signed stateless session cookie (`yb_admin_session`). The key is never echoed or stored in client storage.
   - **Session Token Structure**: The token contains a random 128-bit session ID, issued-at timestamp, version (`v1`), and an **absolute 24-hour expiration** (not sliding). It is formatted as `base64url(payload) + "." + base64url(HMAC-SHA256(signing_key, payload))`.
   - **Revoke-Everything Mechanism (Key Rotation)**: The session signing key is derived via `HMAC-SHA256(ADMIN_SECRET_KEY, b"yojana-admin-session-v1")`. Rotating `ADMIN_SECRET_KEY` immediately invalidates all active sessions across all devices and browsers without requiring a database table.
   - **Cookie Attributes**:
     - `name`: `yb_admin_session`
     - `HttpOnly`: `True` (inaccessible to JavaScript)
     - `SameSite`: `Strict` (never sent on cross-site requests)
     - `Path`: `/api/admin`
     - `Max-Age`: `86400` (24 hours)
     - `Secure`: Controlled by `ADMIN_COOKIE_SECURE`:
       - `auto` (default): Enabled automatically on HTTPS requests or when `X-Forwarded-Proto: https` with `TRUSTED_PROXY_COUNT > 0`. Works seamlessly over `http://127.0.0.1` locally.
       - `true`: Forces `Secure=True` (mandatory for production over HTTPS).
       - `false`: Disables `Secure` flag (for non-HTTPS testing).
   - **Production Requirement**: Production deployments must run over HTTPS to ensure encrypted transit of session cookies.

3. **CSRF & Origin Protection**:
   - Every state-changing request (`POST`, `PUT`, `DELETE`, `PATCH`) under `/api/admin/*` (except `/api/admin/login`) requires an `X-CSRF-Token` header.
   - The CSRF token is cryptographically derived from the session: `base64url(HMAC-SHA256(signing_key, session_id + "csrf"))`.
   - The admin panel keeps the CSRF token in memory only (never written to `localStorage` or `sessionStorage`).
   - Strict Origin/Referer verification: Any request with an `Origin` or `Referer` header differing from the request `Host` is rejected with `403 Forbidden`.

4. **Brute-Force Protection & Client IP Handling**:
   - Failed logins count toward an in-memory per-IP rate limiter. 5 failed attempts from an IP within 10 minutes trigger an automatic 10-minute temporary lockout (`429 Too Many Requests`).
   - **`TRUSTED_PROXY_COUNT`**:
     - `TRUSTED_PROXY_COUNT=0` (default): Uses `request.client.host` and completely ignores client-injected `X-Forwarded-For` headers.
     - `TRUSTED_PROXY_COUNT=1` (or `N > 0`): Safely extracts the real client IP by counting `N` trusted proxies from the right of `X-Forwarded-For`.
   - **Global Safety Valve**: If total failed attempts across all IPs exceed 50 in 10 minutes, all invalid login attempts receive `429 Too Many Requests`. Requests with the valid admin key bypass the global valve, ensuring administrator access is never permanently blocked by distributed attacks.
   - Failed attempts log client IP and timestamp only (keys and tokens are never logged).

5. **Data Isolation & Anti-Scraping**:
   - User passwords and sensitive hashes (`password_hash`) are strictly excluded from all admin responses.
   - All admin responses include `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
   - Admin routes are excluded from any cross-origin CORS allow-credentials / allow-origin policies.

6. **Seeder Safety**:
   - `python seed_schemes.py` skips existing scheme records by default so admin modifications in the database are never accidentally overwritten.
   - Use `python seed_schemes.py --force` only when you explicitly intend to reset database schemes to match `schemes.json`.

---

## 🧪 Running Tests

### End-to-End Profile Persistence & Authentication Test
```bash
python backend/test_profile_flow.py
```

### Dynamic Agriculture Engine Test
```bash
python backend/test_engine.py
```

### Category Target Enforcement Test
```bash
python backend/test_category_enforcement.py
```

### Admin Security & Session Cookie Tests (In-Memory SQLite)
```bash
python backend/test_admin.py
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate user and issue JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user details | Yes (Bearer) |
| `PATCH` | `/api/auth/profile` | Update user profile attributes | Yes (Bearer) |
| `POST` | `/api/evaluate` | Run eligibility evaluation on profile | No |
| `POST` | `/api/feedback` | Submit user feedback on scheme predictions | No |
| `GET` | `/admin-panel` | Self-contained Admin Dashboard | Unlocked via Key |
| `POST` | `/api/admin/login` | Authenticate with key; sets `yb_admin_session` cookie | Admin Key (Body) |
| `GET` | `/api/admin/session` | Inspect current session; returns CSRF token | Session Cookie |
| `POST` | `/api/admin/logout` | Invalidate session; clears cookie | Session Cookie + CSRF |
| `GET` | `/api/admin/schemes` | List all schemes from DB (cache bypassed) | Session Cookie |
| `GET` | `/api/admin/schemes/{id}` | Get scheme by ID | Session Cookie |
| `PUT` | `/api/admin/schemes/{id}` | Update existing scheme with validation | Session Cookie + CSRF |
| `POST` | `/api/admin/schemes` | Create new scheme with validation | Session Cookie + CSRF |
| `GET` | `/api/admin/feedback` | Paginated feedback list (optional scheme filter) | Session Cookie |
| `GET` | `/api/admin/users` | Read-only user list with profile summary | Session Cookie |

---

## 📄 License

This project is licensed under the MIT License.
