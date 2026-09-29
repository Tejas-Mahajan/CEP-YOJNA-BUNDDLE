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
- **Database**: SQLite with WAL (Write-Ahead Logging) mode enabled via SQLAlchemy (timeout = 15s)
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
│   ├── db.py                    # Database Connection & SQLite WAL Mode Listener
│   ├── models.py                # Pydantic Schemas & ProfileUpdateRequest
│   ├── models_db.py             # SQLAlchemy User Model & JSON Attributes
│   ├── auth_utils.py            # JWT Token Generation & Password Hashing
│   ├── requirements.txt         # Pinned Backend Dependencies
│   ├── data/
│   │   ├── schemes.json         # Master Agricultural Schemes Database
│   │   └── users.db             # SQLite Relational User Database
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

## 🧪 Running Tests

### End-to-End Profile Persistence & Authentication Test
```bash
python backend/test_profile_flow.py
```

### Dynamic Agriculture Engine Test
```bash
python backend/test_engine.py
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

---

## 📄 License

This project is licensed under the MIT License.
