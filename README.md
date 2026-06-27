# LANES: Localised Alternative Navigation for Environs under Submersion

LANES is a real-time, flood-adaptive alternative navigation platform designed for commuters in Pasig City. By mining unstructured, bilingual Taglish text inputs (social media feeds, emergency bulletins, news articles), the system programmatically extracts location tokens, classifies flood depths, and dynamically recalculates driving routes that bypass active inundation zones.

---

## 🎓 Capstone Project Context
Developed in partial fulfillment of the requirements for the degree of **Bachelor of Science in Information Technology** at the **College of Computer Studies, Pamantasan ng Lungsod ng Pasig (PLP)**.

**Authors:**
* Bellen, Jace H.
* Cambe, Roi Yvann M.
* Folloso, Chris Nicolai Z.

**Adviser:** Noreen A. Perez, DIT  
**Target Region:** Pasig City, Philippines (localized commuting sectors)

---

## 📖 Documentation Index

* **For AI Agents & Developers:** [`AGENTS.md`](file:///e:/Files/Documents/GitHub/LANES/AGENTS.md) contains all collaboration protocols, operational boundaries, and coding standards. **AI agents must consult this file for interaction rules.**
* **For System Architecture:** [`DESIGN.md`](file:///e:/Files/Documents/GitHub/LANES/DESIGN.md) serves as the single source of truth for technical design, database schemas, processing flows, and non-functional requirements.

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.11 or v3.12). *Note: Avoid Python 3.13+ for now due to C-compiler build limitations with spaCy.*
* **Docker Desktop** (For running the local PostGIS spatial database).

---

### 1. Database Setup (PostGIS)
Spin up the pre-configured PostgreSQL + PostGIS instance:
```bash
docker compose up -d
```
This starts the database on port `5432` with credentials `postgres` / `postgres` and database name `lanes`.

*(If Docker is not installed, the backend operates in a database-offline fallback mode. Rerouting will succeed but will default to the standard path since flood zones cannot be queried).*

---

### 2. Backend Setup & Run (FastAPI)
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Set up the virtual environment:
   ```bash
   # On Windows
   py -3.12 -m venv venv
   .\venv\Scripts\Activate.ps1

   # On Mac/Linux
   python3.12 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Download the spaCy NLP package:
   ```bash
   python -m spacy download en_core_web_sm
   ```
5. Copy environment variables and set values:
   ```bash
   cp .env.example .env
   ```
6. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend server runs at `http://localhost:8000`.

---

### 3. Frontend Setup & Run (Next.js)
1. Open a new terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The interactive dashboard will be available at `http://localhost:3000`.

---

## 🛠️ Troubleshooting & Fallback
* **TypeError: Failed to fetch (Frontend):** Check that the backend server is running at `http://localhost:8000`.
* **Database Connection Warnings:** If PostgreSQL is offline, the backend logs a startup warning and operates in fallback mode, letting you test routing options using OSRM without crashing the server.
