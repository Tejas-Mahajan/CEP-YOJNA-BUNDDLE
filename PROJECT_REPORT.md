# YojanaBundle — Project Implementation Report

**Project Name:** YojanaBundle  
**Domain:** Rules-Based Agriculture Scheme Eligibility Matcher & Bundling Planner  
**Target Users:** Small, Marginal, and Commercial Farmers in India (Focus: Maharashtra & Central Schemes)  
**Technology Stack:** React 18, Vite, Tailwind CSS, Python 3.10+, FastAPI, SQLAlchemy, SQLite, bcrypt, PyJWT, Pydantic v2, ftfy  
**Report Date:** August 12, 2026  

---

## 1. Project Structure

Below is the directory tree of the `CEP-YOJNA-BUNDDLE` workspace (excluding `node_modules`, `.git`, `venv`, `__pycache__`, and build outputs):

```text
CEP-YOJNA-BUNDDLE/
├── .env
├── .env.example
├── .gitignore
├── PROJECT_REPORT.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── auth_utils.py
│   ├── db.py
│   ├── main.py
│   ├── models.py
│   ├── models_db.py
│   ├── requirements.txt
│   ├── seed_demo_user.py
│   ├── test_auth.py
│   ├── test_engine.py
│   ├── test_hardening.py
│   ├── data/
│   │   ├── schemes.json
│   │   └── users.db
│   └── services/
│       ├── conflicts.py
│       ├── data_cleaner.py
│       ├── evaluator.py
│       ├── overlap.py
│       └── ranker.py
└── frontend/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── components/
        │   ├── ActionPlan.jsx
        │   ├── AuthModal.jsx
        │   ├── CscLocator.jsx
        │   ├── ErrorBoundary.jsx
        │   ├── ExportReport.jsx
        │   ├── FeedbackModal.jsx
        │   ├── FloatingSummaryBar.jsx
        │   ├── Header.jsx
        │   ├── IntroAnimation.jsx
        │   ├── MobileDrawer.jsx
        │   ├── NotificationBell.jsx
        │   ├── OverlapSection.jsx
        │   ├── ProfileForm.jsx
        │   ├── SchemeComparisonModal.jsx
        │   ├── SchemeDirectory.jsx
        │   ├── SchemeModal.jsx
        │   ├── Sidebar.jsx
        │   ├── SummaryCards.jsx
        │   ├── WelcomeBar.jsx
        │   └── WelcomeScreen.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── data/
        │   ├── csc_offices.js
        │   ├── presets.js
        │   └── translations.js
        └── utils/
            └── validation.js
```

### Directory Folder Purpose Summary

| Folder | One-Line Purpose |
| :--- | :--- |
| `backend/` | FastAPI REST server hosting JWT authentication, SQLite user database, rules evaluator, overlap matrix, conflict detector, and ranker. |
| `backend/data/` | Data storage directory storing curated schemes (`schemes.json`) and SQLite relational user database (`users.db`). |
| `backend/services/` | Modular core business logic components for rule matching, text cleaning, overlap graph mapping, conflict detection, and scoring. |
| `frontend/` | Vite + React single-page application (SPA) client interface codebase. |
| `frontend/src/` | Main React application source code including components, context, static data, and utilities. |
| `frontend/src/components/` | Reusable UI components including forms, checklist cards, modals, locators, and summary views. |
| `frontend/src/context/` | React Context providers for global state management (Authentication and saved scheme state). |
| `frontend/src/data/` | Static domain data files (preset farmer profiles, Maharashtra CSC office listings, and English/Marathi/Hindi translations). |
| `frontend/src/utils/` | Utility functions for client-side form validation and deadline text formatting. |

---

## 2. File-by-File Breakdown

### Layer 1: Backend API & Core Engine (`backend/`)

#### 1. [`backend/db.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/db.py)
* **Description:** Database configuration and connection setup using SQLAlchemy. Configures SQLite (`backend/data/users.db`) engine, session factory (`SessionLocal`), base class (`Base`), `init_db()` table initializer, and FastAPI `get_db()` dependency.

#### 2. [`backend/models_db.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/models_db.py)
* **Description:** SQLAlchemy ORM model for user persistence. Defines `User` table (`id`, `name`, `email` unique, `password_hash`, `role`, `created_at`, `_profile_attributes` JSON getter/setter).

#### 3. [`backend/auth_utils.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/auth_utils.py)
* **Description:** Production-grade security utilities. Handles password hashing and verification via `bcrypt`, environment variable parsing (`JWT_SECRET` loaded via `python-dotenv`), and PyJWT signing/decoding (`HS256`, 24-hour expiration).

#### 4. [`backend/main.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/main.py)
* **Description:** Primary FastAPI application entry point. Implements CORS middleware, SQLite startup initialization, global 500 exception handler, reusable `get_current_user` FastAPI dependency, scheme loader, and endpoints (`/api/health`, `/api/schemes`, `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, `/api/evaluate`, `/api/feedback`).

#### 5. [`backend/seed_demo_user.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/seed_demo_user.py)
* **Description:** CLI seeding script inserting demo user (`demo.farmer@example.com` / `FarmerPassword123!`, bcrypt hashed) into `users.db`.

#### 6. [`backend/test_auth.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/test_auth.py)
* **Description:** Automated test suite verifying signup (200 OK + token), duplicate email prevention (409 Conflict), wrong password handling (401 Unauthorized), correct password verification (200 OK), `/api/auth/me` with valid token, and garbage token rejection (401 Unauthorized).

#### 7. [`backend/models.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/models.py)
* **Description:** Pydantic schemas enforcing typing for API requests, responses, scheme entities, rules, overlaps, and conflicts.

#### 8. [`backend/services/evaluator.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/services/evaluator.py)
* **Description:** Dynamic rule evaluation engine matching farmer profiles against scheme rules with null safeguards.

#### 9. [`backend/services/conflicts.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/services/conflicts.py)
* **Description:** Detects mutually exclusive scheme pairs and calculates financial differences.

#### 10. [`backend/services/overlap.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/services/overlap.py)
* **Description:** Graph-based document alias normalization (`DOCUMENT_ALIAS_GRAPH`) and overlap leverage analyzer.

#### 11. [`backend/services/ranker.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/services/ranker.py)
* **Description:** Scoring and ranking engine computing composite priority scores (40% Benefit + 30% Urgency + 30% Readiness).

#### 12. [`backend/services/data_cleaner.py`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/services/data_cleaner.py)
* **Description:** Scheme sanitization using `ftfy` to repair text/mojibake and parse flexible date deadlines.

---

### Layer 2: Frontend Client (`frontend/src/`)

#### 1. [`frontend/src/context/AuthContext.jsx`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/context/AuthContext.jsx)
* **Description:** React Context Provider managing user authentication state. Calls `/api/auth/login`, `/api/auth/signup`, and verifies stored JWT tokens on startup via `/api/auth/me`. Automatically clears session on 401.

#### 2. [`frontend/src/components/AuthModal.jsx`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/frontend/src/components/AuthModal.jsx)
* **Description:** Login and signup modal displaying user-facing error messages (401/409) and 1-click demo login trigger.

---

## 3. Data Pipeline Status

### Current State of Data Stores
* **Schemes Catalog:** Flat JSON file at [`backend/data/schemes.json`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/data/schemes.json) containing 8 verified agriculture schemes (`PM_KISAN`, `PMFBY`, `KCC`, `PM_KUSUM`, `PMKSY`, `SOIL_HEALTH`, `PKVY`, `SMAM`).
* **User Accounts Database:** SQLite relational database at [`backend/data/users.db`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/data/users.db) containing `users` table with bcrypt password hashes and JSON profile attributes.
* **Feedback Storage:** Flat JSON file at [`backend/feedback_log.json`](file:///c:/YojnaBundle/CEP-YOJNA-BUNDDLE/backend/feedback_log.json).

---

## 4. Database Schema (`users.db`)

### `users` Table Schema

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | `PRIMARY KEY` | Unique user identifier (e.g. `usr_aae090c233`). |
| `name` | `VARCHAR` | `NOT NULL` | Full Name of farmer / user. |
| `email` | `VARCHAR` | `UNIQUE`, `NOT NULL` | User email / login identifier. |
| `password_hash` | `VARCHAR` | `NOT NULL` | Bcrypt password hash string. |
| `role` | `VARCHAR` | `DEFAULT 'Farmer'` | User authorization role. |
| `created_at` | `DATETIME` | `DEFAULT UTC` | Account creation timestamp. |
| `profile_attributes` | `TEXT` | `NULLABLE` | JSON serialized farmer profile attributes (`annual_income`, `age`, `land_acres`, `owned_documents`, etc.). |

---

## 5. API Endpoints Summary

| Method | Path | Auth Required | Request Body / Header | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | None | System status and engine version. |
| `GET` | `/api/schemes` | No | None | List of active sanitized schemes. |
| `POST` | `/api/auth/signup` | No | `SignupRequest` | Validates email, hashes password with bcrypt, inserts into `users.db`, returns PyJWT. |
| `POST` | `/api/auth/login` | No | `LoginRequest` | Lookup email, verifies bcrypt hash, returns 401 on failure or 200 + PyJWT on success. |
| `GET` | `/api/auth/me` | **Yes (Bearer)** | `Authorization: Bearer <jwt>` | Decodes token, verifies expiry & signature, returns user record from `users.db`. |
| `POST` | `/api/evaluate` | No | `UserProfile` | Runs rule matcher, conflict detector, overlap matrix, and weighted ranker. |
| `POST` | `/api/feedback` | No | `FeedbackRequest` | Appends scheme rating and comment to `feedback_log.json`. |

---

## 6. Verification & Test Suite

All test suites execute cleanly with zero errors:
1. **Authentication Test Suite (`backend/test_auth.py`):** Verified signup (200), duplicate email (409), wrong password (401), correct password (200), token validation (200), and garbage token rejection (401).
2. **Matching Engine Test Suite (`backend/test_engine.py`):** Evaluated 4 test profiles against 8 schemes.
3. **Hardening Test Suite (`backend/test_hardening.py`):** Verified text cleaning, deadline parsing, and null profile handling.
