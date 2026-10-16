# YojanaBundle — Follow-up Deployment & Architecture Analysis

## 7. Deployment-Critical Details

### 7.1. CORS Middleware Configuration (`backend/main.py`)
Verbatim CORS middleware configuration from [`backend/main.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/main.py#L33-L45):

```python
# Enable CORS for local React dev server ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Key Deployment Insights:**
* `allow_origins`: Contains 4 local development URLs (`http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:5173`, `http://127.0.0.1:5173`) and the wildcard `"*"`.
* `allow_credentials=True`: When combined with wildcard `"*"`, modern browsers and CORS specifications reject credentialed requests (`Authorization` headers or cookies) unless explicit origins are returned.
* Production frontend origins (e.g., custom domains, Vercel, Render) are not yet configured or externalized into environment variables.

---

### 7.2. "localhost" and "127.0.0.1" Codebase Grep
Searching across the entire codebase (excluding `node_modules` and `.git`) identified **6 occurrences** across **2 files**:

| File | Line Number | Matching Line | Intended Purpose |
| :--- | :--- | :--- | :--- |
| [`backend/main.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/main.py#L36) | 36 | `"http://localhost:3000",` | Allowed CORS origin for React/Vite development server on port 3000 via hostname `localhost`. |
| [`backend/main.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/main.py#L37) | 37 | `"http://127.0.0.1:3000",` | Allowed CORS origin for React/Vite development server on port 3000 via loopback IP `127.0.0.1`. |
| [`backend/main.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/main.py#L38) | 38 | `"http://localhost:5173",` | Allowed CORS origin for standard Vite dev server default port 5173 via hostname `localhost`. |
| [`backend/main.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/main.py#L39) | 39 | `"http://127.0.0.1:5173",` | Allowed CORS origin for standard Vite dev server default port 5173 via loopback IP `127.0.0.1`. |
| [`backend/main.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/main.py#L319) | 319 | `uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)` | Server bind host address for direct execution (`python main.py`). For cloud container/Docker deployment, this must bind to `0.0.0.0`. |
| [`frontend/vite.config.js`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/vite.config.js#L11) | 11 | `target: 'http://127.0.0.1:8000',` | Vite local development proxy target forwarding frontend requests matching `/api` to the local FastAPI backend server. |

---

### 7.3. Frontend Backend HTTP Requests (`frontend/src`)
Every HTTP request to the backend in `frontend/src` uses the browser `fetch` API. There are **8 calls across 4 files**:

1. [`frontend/src/context/AuthContext.jsx:63`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/context/AuthContext.jsx#L63):
   * Call: `const res = await fetch('/api/auth/me', { headers: { 'Authorization': \`Bearer ${storedToken}\` } });`
   * Target URL: `'/api/auth/me'`
2. [`frontend/src/context/AuthContext.jsx:109`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/context/AuthContext.jsx#L109):
   * Call: `const res = await fetch('/api/auth/login', { method: 'POST', ... });`
   * Target URL: `'/api/auth/login'`
3. [`frontend/src/context/AuthContext.jsx:148`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/context/AuthContext.jsx#L148):
   * Call: `const res = await fetch('/api/auth/signup', { method: 'POST', ... });`
   * Target URL: `'/api/auth/signup'`
4. [`frontend/src/context/AuthContext.jsx:192`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/context/AuthContext.jsx#L192):
   * Call: `const res = await fetch('/api/auth/profile', { method: 'PUT', ... });`
   * Target URL: `'/api/auth/profile'`
5. [`frontend/src/App.jsx:86`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/App.jsx#L86):
   * Call: `const res = await fetch('/api/evaluate', { method: 'POST', ... });`
   * Target URL: `'/api/evaluate'`
6. [`frontend/src/App.jsx:139`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/App.jsx#L139):
   * Call: `await fetch('/api/feedback', { method: 'POST', ... });`
   * Target URL: `'/api/feedback'`
7. [`frontend/src/components/SchemeDirectory.jsx:19`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/components/SchemeDirectory.jsx#L19):
   * Call: `const res = await fetch('/api/schemes');`
   * Target URL: `'/api/schemes'`
8. [`frontend/src/components/Sidebar.jsx:15`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/components/Sidebar.jsx#L15):
   * Call: `const res = await fetch('/api/schemes');`
   * Target URL: `'/api/schemes'`

**Architecture Assessment:**
* **Shared constant/config:** **No**. There is no central configuration module, shared constant, or environment variable (e.g., `import.meta.env.VITE_API_URL` or `API_BASE_URL`).
* **Inline repetition:** Endpoint URLs are hardcoded as relative string literals (`'/api/...'`) directly in each component/context.
* **Production implication:** In local dev, Vite proxies `/api` to `127.0.0.1:8000`. In production static builds (e.g. Vercel, S3, Netlify), requests will hit the frontend host at `/api/*` and return 404 unless a reverse proxy (like Nginx, Caddy, or hosting platform rewrites) is configured, or an environment-based base URL is introduced.

---

### 7.4. Vite Dev Server Proxy Configuration (`frontend/vite.config.js`)
[`frontend/vite.config.js`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/vite.config.js#L7-L16) contains the following dev proxy configuration:

```javascript
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
```

Full file content:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

---

### 7.5. Environment Variables Inventory & Externalization Analysis

#### Defined Variable Names by File:
* [`backend/.env`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/.env):
  * `JWT_SECRET`
  * `JWT_ALGORITHM`
  * `ACCESS_TOKEN_EXPIRE_HOURS`
* [`backend/.env.example`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/.env.example):
  * `JWT_SECRET`
  * `JWT_ALGORITHM`
  * `ACCESS_TOKEN_EXPIRE_HOURS`
* **Root `.env`**: File does not exist on disk.
* **Root `.env.example`**: File does not exist on disk.

#### Externalized vs. Still Hardcoded Summary:
* **Already Externalized:**
  * JWT signing secret (`JWT_SECRET`)
  * JWT algorithm (`JWT_ALGORITHM`)
  * JWT token expiration duration (`ACCESS_TOKEN_EXPIRE_HOURS`)
  * Database URL lookup support: `backend/db.py` checks `os.environ.get("DATABASE_URL")` (though omitted from `.env` and `.env.example`).
* **Still Hardcoded:**
  * CORS allowed origins (`["http://localhost:3000", ...]` in `backend/main.py`)
  * Server bind host & port (`host="127.0.0.1"`, `port=8000` in `backend/main.py`)
  * Vite proxy target (`http://127.0.0.1:8000` in `frontend/vite.config.js`)
  * Default SQLite database path (`backend/data/users.db` in `backend/db.py`)
  * Schemes catalog path (`backend/data/schemes.json` in `backend/main.py`)
  * Feedback log path (`backend/feedback_log.json` in `backend/main.py`)
  * Frontend API base URL (all frontend endpoints hardcoded to relative `'/api/...'` without `VITE_API_BASE_URL`)

---

### 7.6. SQLite Path Construction in `backend/db.py`
* **Status:** Constructed as an **absolute path** (anchored via `__file__`).
* **Exact Lines** ([`backend/db.py:5-6`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/db.py#L5-L6)):
```python
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "users.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")
```
* **Explanation:** `os.path.dirname(__file__)` resolves to the absolute directory containing `db.py` (`.../backend`), making `DB_PATH` an absolute path (`.../backend/data/users.db`) independent of the working directory from which Python is launched.

---

### 7.7. Feedback Log Path in `backend/main.py`
* **Status:** Written using an **absolute path** (anchored via `__file__`).
* **Exact Lines** ([`backend/main.py:48`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/main.py#L48) and [`backend/main.py:312`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/main.py#L312)):
```python
# Line 48: Path Definition
FEEDBACK_PATH = os.path.join(os.path.dirname(__file__), "feedback_log.json")
```
```python
# Lines 312-313: File Write Operation
    with open(FEEDBACK_PATH, "w", encoding="utf-8") as f:
        json.dump(feedback_entries, f, indent=2)
```
* **Explanation:** Like `db.py`, `FEEDBACK_PATH` uses `os.path.dirname(__file__)`, making it an absolute filesystem path pointing to `.../backend/feedback_log.json`.
