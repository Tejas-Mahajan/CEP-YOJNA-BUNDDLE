# 🖥️ YojanaBundle — Code-Level Breakdown (Backend & Frontend)

---

## ⚙️ Part 1: Backend Code Explanation (`backend/`)

The backend is built with **Python 3.10+** and **FastAPI**, structured into modular business logic services.

---

### 1. `backend/main.py` — REST API Gateway & Security
* **Purpose**: Serves as the central API gateway handling HTTP routes, CORS, JWT authentication, and request routing.
* **Key Functions**:
  * `startup_event()`: Automatically initializes SQLite database tables (`init_db()`) on server startup.
  * `get_current_user()`: Reusable FastAPI dependency (`Depends`) that extracts the JWT Bearer token from HTTP headers, verifies its signature via `decode_jwt_token()`, and fetches the authenticated user from SQLite.
  * `@app.post("/api/evaluate")`: The core evaluation endpoint. It receives the farmer profile payload, loads schemes from `data/schemes.json`, runs the evaluator, conflict detector, document overlap analyzer, and ranker, returning a consolidated JSON response.

---

### 2. `backend/services/evaluator.py` — Dynamic Rule Evaluation Engine
* **Purpose**: Evaluates farmer profile traits against dynamic scheme rules stored in JSON without hardcoding any eligibility criteria.
* **Key Functions**:
  * `evaluate_rule_condition(profile_dict, rule)`: Evaluates dynamic condition predicates:
    * `<=` / `>=`: Numerical checks for land area and annual income (with `safe_float` null safeguards).
    * `==` / `!=`: Exact match checks for category, gender, or state.
    * `IN` / `NOT_IN`: Checks if a user's trait exists within an allowed list of values.
    * `BETWEEN`: Range checks (e.g., age between 18 and 60).
  * `evaluate_scheme_eligibility(profile, scheme)`: Iterates through all rules array of a scheme. If all conditions pass, the scheme is marked eligible; otherwise, it returns a list of exact disqualification reasons.

---

### 3. `backend/services/conflicts.py` — Mutual Exclusion & Conflict Detector
* **Purpose**: Identifies mutually exclusive scheme pairs (e.g., applying for two competing government irrigation subsidies).
* **Key Functions**:
  * `detect_scheme_conflicts(eligible_schemes)`: 
    * Maps scheme IDs and checks the `mutually_exclusive_with` array.
    * Compares financial benefit amounts (`b1` vs `b2`).
    * Identifies the **Primary Scheme** (higher yield) and **Secondary Scheme** (lower yield).
    * Calculates the exact financial difference (e.g., *"Claiming Scheme A gives ₹15,000 more benefit than Scheme B"*).

---

### 4. `backend/services/overlap.py` — Document Overlap & Leverage Matrix
* **Purpose**: Analyzes document dependencies across eligible schemes to identify high-leverage certificates.
* **Key Functions**:
  * `DOCUMENT_ALIAS_GRAPH`: Canonical dictionary that normalizes different document naming variations (e.g., *"7/12 Land Record Extract"*, *"Land Revenue Receipt"*, and *"7/12 Extract"* all map to `"Land Ownership Proof (7/12 Extract)"`).
  * `analyze_document_overlaps(eligible_schemes, owned_docs)`:
    * Builds an inverted index mapping each canonical document to all schemes that require it.
    * Assigns **Efficiency Tags**:
      * `⚡ High Leverage` (Requires 3+ schemes unlocked)
      * `✨ Medium Leverage` (2 schemes unlocked)
      * `📄 Standard Document` (1 scheme)
    * Generates highlight callout banners informing farmers which document gives maximum unlock value.

---

### 5. `backend/services/ranker.py` — Multi-Tier Priority Scoring Algorithm
* **Purpose**: Ranks schemes into High, Medium, and Low priority tiers so farmers focus on the most impactful schemes first.
* **Scoring Formula**:
  $$\text{Composite Score} = w_1 \cdot \text{Benefit Amount} + w_2 \cdot \text{Deadline Urgency} + w_3 \cdot \text{Document Readiness}$$
* **Tier Categorization**:
  * **High Priority Tier**: Composite score $\ge 70$ (High financial yield, short deadline, or farmer already holds documents).
  * **Medium Priority Tier**: Score between 40 and 69.
  * **Low Priority Tier**: Score $< 40$.

---

## 🎨 Part 2: Frontend Code Explanation (`frontend/src/`)

The frontend is built with **React 18** and **Vite**, using modular components, global React Context, and Tailwind CSS.

---

### 1. `frontend/src/App.jsx` — SPA Root Container & Flow Control
* **Purpose**: Central state coordinator and router for the single-page application.
* **Key States**:
  * `appFlowState`: Manages application state machine (`INTRO` $\rightarrow$ `AUTH` $\rightarrow$ `WELCOME` $\rightarrow$ `DASHBOARD`).
  * `activeNav`: Handles tab navigation (`matcher`, `plan`, `vault`, `directory`, `csc`, `export`).
  * `lang`: Supports multilingual localization (`en`, `mr`, `hi`) via `TRANSLATIONS` data object.
  * `debounceTimerRef`: Uses debouncing to prevent excessive REST API calls when farmers update profile form inputs.

---

### 2. `frontend/src/context/AuthContext.jsx` — Global State & Authentication
* **Purpose**: Provides global user authentication state, token storage, and persistent profile updates across the app.
* **Key Functions**:
  * `login(email, password)`: Sends `POST /api/auth/login`, receives JWT token, stores it in `localStorage`, and updates `user` state.
  * `updateUserProfileAttributes(newAttrs)`: Sends `PATCH /api/auth/profile` to save profile changes permanently in SQLite.
  * `toggleSaveScheme(schemeId)`: Allows users to bookmark/save schemes into their persistent personal vault.

---

### 3. `frontend/src/components/ProfileForm.jsx` — Farmer Input Form
* **Purpose**: Interactive input form for farmers to enter demographic traits and check off owned documents.
* **Key Features**:
  * Real-time form state validation for land acreage, annual income, age, category, state, and document checkboxes.
  * Quick profile presets (e.g., *"Small Farmer - Maharashtra"*, *"Commercial Farmer"*) for 1-click testing.

---

### 4. `frontend/src/components/OverlapSection.jsx` — Document Efficiency UI
* **Purpose**: Visualizes the document overlap matrix returned by `backend/services/overlap.py`.
* **Key Features**:
  * Renders color-coded leverage badges (`High Leverage`, `Medium Leverage`).
  * Interactive filtering: Clicking a document pill filters the scheme list to show exactly which schemes require that document.

---

### 5. `frontend/src/components/CscLocator.jsx` — CSC Center Finder & Action Plan
* **Purpose**: Assists farmers with offline physical application submission.
* **Key Features**:
  * District and Taluka drop-down search filtering through local Maharashtra CSC office data (`data/csc_offices.js`).
  * Action Checklist generator creating step-by-step application instructions with estimated processing times.

---

## 💡 Summary Table for Ma'am

| Component | Layer | Core Function |
| :--- | :--- | :--- |
| `main.py` | Backend | FastAPI REST API endpoints & JWT Auth dependency |
| `evaluator.py` | Backend | Dynamic JSON predicate rule evaluation engine |
| `conflicts.py` | Backend | Mutual exclusion detector & primary yield scheme selector |
| `overlap.py` | Backend | Document alias graph & leverage efficiency calculator |
| `ranker.py` | Backend | Composite priority scoring (High/Medium/Low tiers) |
| `App.jsx` | Frontend | React SPA state machine, debounced API calls & tab navigation |
| `AuthContext.jsx` | Frontend | JWT token management & SQLite profile attribute synchronization |
| `ProfileForm.jsx` | Frontend | Interactive farmer profile input with validation |
| `OverlapSection.jsx` | Frontend | Interactive document leverage graph & scheme filter UI |
| `CscLocator.jsx` | Frontend | Searchable CSC office locator & action plan generator |
