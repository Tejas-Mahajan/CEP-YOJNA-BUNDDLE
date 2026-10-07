# 🌾 YojanaBundle — Project Explanation Guide for Ma'am

---

## 🎙️ Section 1: Simple Line-by-Line Speaking Script (Easy to Memorize)

> Use this exact script when Ma'am asks: **"Explain your project to me."**

1. **Opening Statement:**
   *"Good morning / afternoon Ma'am. Today I am presenting **YojanaBundle**, a Smart Agricultural Eligibility Matcher & Scheme Bundling Planner for farmers in India."*

2. **The Core Problem:**
   *"In India, farmers struggle to find government schemes because eligibility rules are complex, required documents are confusing, and they don't know which schemes conflict with each other."*

3. **Our Solution:**
   *"YojanaBundle evaluates a farmer's profile—like land size, income, category, and state—against government scheme rules using an automated rule-matching engine."*

4. **Key Highlights / Unique Features:**
   * **Rule Evaluator:** Dynamically checks farmer details against central and state agricultural schemes.
   * **Document Overlap Analysis:** Tells the farmer which single document (like *7/12 Land Extract*) unlocks the maximum number of schemes.
   * **Conflict Detector:** Flags mutually exclusive schemes so farmers don't get disqualified by applying for competing subsidies.
   * **Priority Ranker:** Ranks schemes into High, Medium, and Low tiers based on financial benefit, urgency, and document readiness.
   * **CSC Locator:** Shows nearby Common Service Centres (CSCs) where farmers can physically submit applications.

5. **Conclusion:**
   *"Overall, YojanaBundle maximizes financial assistance for farmers while reducing paperwork confusion."*

---

## 🏗️ Section 2: Technology Stack & Architecture

| Layer | Tech Used | Purpose / Why Used |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS | Fast Single Page Application (SPA), responsive UI with modern styling |
| **Backend** | Python 3.10+, FastAPI | High-performance RESTful API endpoints and backend dynamic evaluation |
| **Database** | SQLite (SQLAlchemy, WAL mode) | Fast relational storage for user profiles with concurrency safety |
| **Security** | PyJWT, bcrypt | JWT Bearer token authentication and encrypted password storage |
| **Data Format** | JSON (`schemes.json`) | Stores scheme eligibility rules and predicate conditions dynamically |

---

## ⚙️ Section 3: Detailed Step-by-Step Data Flow

```
[ Farmer Profile Input ] ➔ [ Rule Evaluator ] ➔ [ Conflict Detector ] ➔ [ Document Overlap Matrix ] ➔ [ Priority Ranker ] ➔ [ Action Checklist & CSC Locator ]
```

### **1. Farmer Onboarding (`ProfileForm.jsx`)**
* The farmer inputs their profile: Land Area (Hectares), Annual Income, Category (SC/ST/OBC/Gen), Age, State, and currently held documents.

### **2. Dynamic Rule Matching (`backend/services/evaluator.py`)**
* The engine evaluates predicates stored in JSON rules (e.g., `land_hectares <= 2.0`, `income <= 200000`, `state IN ["Maharashtra", "Pan-India"]`).
* If eligible, the scheme moves to the next stage; if ineligible, specific disqualification reasons are logged.

### **3. Mutual Exclusion & Conflict Detection (`backend/services/conflicts.py`)**
* Scans matched schemes to check for conflicts (e.g., claiming two competing government irrigation grants).
* Prevents illegal double-dipping or invalid application submissions.

### **4. Document Overlap Matrix (`backend/services/overlap.py`)**
* Analyzes required vs. held documents across all eligible schemes.
* Identifies **high-leverage documents** (e.g., *"Obtaining a 7/12 Extract unlocks 4 schemes simultaneously"*).

### **5. Multi-Tier Priority Ranking (`backend/services/ranker.py`)**
* Calculates composite score:
  $$\text{Score} = \text{Financial Benefit} + \text{Urgency Factor} + \text{Document Readiness}$$
* Ranks schemes into **High**, **Medium**, and **Low** priority tiers.

### **6. Action Plan & CSC Locator (`frontend/src/components/CscLocator.jsx`)**
* Generates a step-by-step checklist for the farmer.
* Provides local Common Service Centre (CSC) location details for submitting physical applications.

---

## ❓ Section 4: Expected Viva Q&A with Ma'am

**Q1: How do you evaluate rules dynamically without hardcoding them?**
> *"Ma'am, rules are defined as JSON objects containing attributes like `field`, `operator` (`<=`, `>=`, `==`, `IN`), and `value`. The `evaluator.py` module parses these rules at runtime, allowing new schemes to be added without changing backend python code."*

**Q2: What is the main innovation in this project?**
> *"The Document Overlap matrix and Conflict Detection engine. Existing government portals only list schemes, whereas our system plans the best bundle of non-conflicting schemes and optimizes document gathering for the farmer."*

**Q3: How is user authentication implemented?**
> *"We use JWT (JSON Web Tokens) with Bearer headers. Passwords are salted and hashed with `bcrypt`, and user profile data is stored in SQLite."*

---
