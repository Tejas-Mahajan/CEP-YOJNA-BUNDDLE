# Project Structure Overview

This project is a farmer scheme recommendation app. In simple terms, it helps a farmer enter their profile (income, land, age, documents, state, etc.), checks which government schemes they may qualify for, shows the best options, and explains the next steps.

The app is split into two main parts:

- Frontend: the user-facing website and dashboard
- Backend: the logic engine, API, authentication, and database

## Core function in brief

The app does four main jobs:

1. Takes a farmer's profile as input
2. Compares that profile against a list of agricultural schemes
3. Detects conflicts, overlaps, and rankings among schemes
4. Shows the best-matching schemes and action plan to the user

It is essentially a smart eligibility matcher and bundle planner for government schemes in India.

---

## Root-level structure

```text
CEP-YOJNA-BUNDLE/
├── README.md
├── PROJECT_REPORT.md
├── ANALYSIS.md
├── DEPLOYMENT_AUDIT.md
├── .gitignore
├── backend/
│   ├── main.py
│   ├── db.py
│   ├── models.py
│   ├── models_db.py
│   ├── auth_utils.py
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   ├── Procfile
│   ├── data/
│   │   ├── schemes.json
│   │   └── users.db
│   ├── services/
│   │   ├── evaluator.py
│   │   ├── conflicts.py
│   │   ├── overlap.py
│   │   ├── ranker.py
│   │   └── data_cleaner.py
│   └── tests / scripts
│       ├── test_auth.py
│       ├── test_engine.py
│       ├── test_hardening.py
│       ├── test_profile_flow.py
│       └── runtime.txt
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── App.jsx
        ├── config.js
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
        │   ├── WelcomeScreen.jsx
        │   └── other UI components
        ├── context/
        │   └── AuthContext.jsx
        ├── data/
        │   ├── csc_offices.js
        │   ├── presets.js
        │   └── translations.js
        ├── utils/
        │   └── validation.js
```

---

## Top-level files

### [README.md](./README.md)
A user-facing guide. It tells you what the app does, how to install it, how to run it, and which technologies are used.

### [PROJECT_REPORT.md](./PROJECT_REPORT.md)
A project summary document. It likely explains the application goals, logic, and evaluation notes for project reviewers or stakeholders.

### [ANALYSIS.md](./ANALYSIS.md)
A technical or project analysis file. It may contain deeper reasoning, architecture notes, or review findings.

### [DEPLOYMENT_AUDIT.md](./DEPLOYMENT_AUDIT.md)
A deployment and environment audit file. It focuses on how the project should be deployed and whether configuration is safe and correct.

### [.gitignore](./.gitignore)
Tells Git which files and folders should be ignored, such as environment files, cache folders, and generated output.

---

## Backend folder

The backend is the brain of the project. It owns the API, user login, scheme matching rules, and database logic.

### [backend/main.py](./backend/main.py)
This is the main FastAPI application file. It creates the server, exposes API routes, handles login/signup, user profile updates, and scheme evaluation. It is the central entry point for the backend.

### [backend/db.py](./backend/db.py)
Sets up the database connection and initializes tables. This file is responsible for connecting the app to SQLite and preparing the database for use.

### [backend/models.py](./backend/models.py)
Defines the request/response data structures used by FastAPI, such as user profile input, evaluation results, feedback payloads, and authentication objects.

### [backend/models_db.py](./backend/models_db.py)
Defines the database models for users and other persisted data. This is where SQLAlchemy tables are declared and mapped to Python objects.

### [backend/auth_utils.py](./backend/auth_utils.py)
Handles security logic such as password hashing, password verification, and JWT token creation/validation. This keeps user login secure.

### [backend/requirements.txt](./backend/requirements.txt)
Lists the Python packages the backend needs to run. This is used for installation in the server environment.

### [backend/.env](./backend/.env)
Local environment file with secret or runtime settings. It is usually not committed to source control in real projects.

### [backend/.env.example](./backend/.env.example)
Example values for environment variables. It helps developers know what settings to configure without exposing real secrets.

### [backend/Procfile](./backend/Procfile)
Used by deployment services to tell them how to start the backend app in production.

### [backend/runtime.txt](./backend/runtime.txt)
Usually contains the Python runtime version to use in deployment platforms like Heroku or similar hosts.

---

## Backend data folder

### [backend/data/schemes.json](./backend/data/schemes.json)
This is the master database of schemes. It contains all available government agricultural schemes, their conditions, eligibility rules, required documents, deadlines, and benefits.

### [backend/data/users.db](./backend/data/users.db)
SQLite database file storing user accounts and profile data. It keeps registrations, saved profile information, and related user state.

---

## Backend services folder

This folder contains the actual business logic for evaluating and ranking schemes.

### [backend/services/evaluator.py](./backend/services/evaluator.py)
Checks whether a farmer profile satisfies the rules of each scheme. It reads rule fields like income, land size, category, state, or documents and decides if the scheme is eligible.

### [backend/services/conflicts.py](./backend/services/conflicts.py)
Looks for mutually exclusive schemes. If two schemes conflict or cannot be combined, it flags that issue and prevents bad recommendations.

### [backend/services/overlap.py](./backend/services/overlap.py)
Compares the documents required by different schemes. This helps identify which documents unlock multiple schemes at once and reduces duplication.

### [backend/services/ranker.py](./backend/services/ranker.py)
Assigns scores and priority levels to eligible schemes. It ranks them by value, urgency, and usefulness so the app can present the best options first.

### [backend/services/data_cleaner.py](./backend/services/data_cleaner.py)
Cleans and normalizes scheme data before it is used. This helps handle inconsistent text, unwanted symbols, or formatting issues.

---

## Backend test scripts

These files test the backend logic and security.

### [backend/test_auth.py](./backend/test_auth.py)
Tests user authentication and login behavior.

### [backend/test_engine.py](./backend/test_engine.py)
Tests the scheme evaluation engine and eligibility rules.

### [backend/test_hardening.py](./backend/test_hardening.py)
Checks hardening and security behavior of the app.

### [backend/test_profile_flow.py](./backend/test_profile_flow.py)
Tests the full profile flow: signup, update, saving, and evaluation.

---

## Frontend folder

The frontend is the user interface. It allows the farmer to input data, view results, compare schemes, and navigate the application.

### [frontend/package.json](./frontend/package.json)
Lists the frontend dependencies and scripts used to run the app.

### [frontend/vite.config.js](./frontend/vite.config.js)
Configuration for Vite, the development/build tool used by the frontend.

### [frontend/tailwind.config.js](./frontend/tailwind.config.js)
Configuration for Tailwind CSS used for styling the interface.

### [frontend/postcss.config.js](./frontend/postcss.config.js)
Helps Tailwind and PostCSS process styles correctly.

### [frontend/index.html](./frontend/index.html)
The main HTML page that loads the React app.

### [frontend/.env.example](./frontend/.env.example)
Example frontend environment settings.

---

## Frontend src folder

### [frontend/src/main.jsx](./frontend/src/main.jsx)
Starts the application and mounts React into the browser.

### [frontend/src/App.jsx](./frontend/src/App.jsx)
This is the main application page. It controls the app flow, loads scheme data, evaluates the farmer profile, switches tabs, opens modals, and coordinates the dashboard layout.

### [frontend/src/index.css](./frontend/src/index.css)
Global styling, layout rules, and visual theme styling for the app.

### [frontend/src/config.js](./frontend/src/config.js)
Stores frontend configuration like API base URL or environment-specific values.

---

## Frontend components folder

This folder has most of the UI screen sections and reusable widgets.

### [frontend/src/components/Header.jsx](./frontend/src/components/Header.jsx)
Top header for the app with navigation or branding.

### [frontend/src/components/Sidebar.jsx](./frontend/src/components/Sidebar.jsx)
Left navigation panel for switching sections like matcher, directory, plan, and export.

### [frontend/src/components/ProfileForm.jsx](./frontend/src/components/ProfileForm.jsx)
Lets the user edit their profile details such as income, age, documents, category, and land area.

### [frontend/src/components/SummaryCards.jsx](./frontend/src/components/SummaryCards.jsx)
Displays summary metrics like number of eligible schemes, document overlap, or recommended priority.

### [frontend/src/components/OverlapSection.jsx](./frontend/src/components/OverlapSection.jsx)
Shows document overlap information between schemes.

### [frontend/src/components/ActionPlan.jsx](./frontend/src/components/ActionPlan.jsx)
Creates a checklist or action plan showing what the farmer should do next.

### [frontend/src/components/SchemeDirectory.jsx](./frontend/src/components/SchemeDirectory.jsx)
Lists all available schemes, often in a searchable or browsable directory.

### [frontend/src/components/SchemeModal.jsx](./frontend/src/components/SchemeModal.jsx)
Shows full details of a single scheme in a modal popup.

### [frontend/src/components/SchemeComparisonModal.jsx](./frontend/src/components/SchemeComparisonModal.jsx)
Allows side-by-side comparison of two schemes.

### [frontend/src/components/CscLocator.jsx](./frontend/src/components/CscLocator.jsx)
Displays CSC office locations or nearby service centers relevant to the farmer.

### [frontend/src/components/AuthModal.jsx](./frontend/src/components/AuthModal.jsx)
Handles sign in and sign up flow in the UI.

### [frontend/src/components/FeedbackModal.jsx](./frontend/src/components/FeedbackModal.jsx)
Allows the user to submit feedback on scheme quality or recommendations.

### [frontend/src/components/ExportReport.jsx](./frontend/src/components/ExportReport.jsx)
Lets users export recommendation results or reports.

### [frontend/src/components/IntroAnimation.jsx](./frontend/src/components/IntroAnimation.jsx)
The welcome/intro animation shown when the app loads.

### [frontend/src/components/WelcomeScreen.jsx](./frontend/src/components/WelcomeScreen.jsx)
The initial landing/welcome screen.

### [frontend/src/components/WelcomeBar.jsx](./frontend/src/components/WelcomeBar.jsx)
A top bar or cue to guide the user through setup.

### [frontend/src/components/FloatingSummaryBar.jsx](./frontend/src/components/FloatingSummaryBar.jsx)
A floating summary widget that stays on screen and shows important recommendation updates.

### [frontend/src/components/MobileDrawer.jsx](./frontend/src/components/MobileDrawer.jsx)
Navigation drawer for mobile-sized screens.

### [frontend/src/components/NotificationBell.jsx](./frontend/src/components/NotificationBell.jsx)
Shows alerts or notifications to the user.

### [frontend/src/components/ErrorBoundary.jsx](./frontend/src/components/ErrorBoundary.jsx)
Catches rendering errors and prevents the whole app from crashing.

---

## Frontend context folder

### [frontend/src/context/AuthContext.jsx](./frontend/src/context/AuthContext.jsx)
Stores authentication state and provides login/logout/profile update helpers to the rest of the app.

---

## Frontend data folder

### [frontend/src/data/translations.js](./frontend/src/data/translations.js)
Contains text translations for the app in different languages such as English, Marathi, and Hindi.

### [frontend/src/data/presets.js](./frontend/src/data/presets.js)
Contains starter or preset values used to populate the farmer profile form.

### [frontend/src/data/csc_offices.js](./frontend/src/data/csc_offices.js)
Stores CSC office location data used by the locator feature.

---

## Frontend utils folder

### [frontend/src/utils/validation.js](./frontend/src/utils/validation.js)
Validates form inputs and helps clean or check values before sending them to the backend.

---

## Why this project matters

This app is not just a website. It is a decision-support tool for farmers. It tries to simplify a confusing landscape of government schemes by:

- understanding the farmer's situation
- matching them to the right benefits
- checking if the schemes are compatible
- explaining what documents are missing
- organizing the steps to apply

In short, it helps farmers save time, avoid missing benefits, and make better decisions.
