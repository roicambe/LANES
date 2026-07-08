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

### 1. Map Data & Routing Engine Setup (One-time only)
LANES uses a local Open Source Routing Machine (OSRM) engine to calculate flood-adaptive routes. You need to download the map data and compile the routing graph first.
1. Open a PowerShell terminal at the root of the project.
2. Run the automated setup script to download the Philippines OpenStreetMap data and build the MLD routing graph:
   ```powershell
   .\setup_osrm.ps1
   ```
   *(Note: This downloads ~200MB of data and may take a few minutes. Wait for it to say "OSRM Graph successfully built!" before proceeding).*

---

### 2. Start Background Services (Database & Router)
Spin up the pre-configured PostgreSQL + PostGIS database and the local OSRM routing engine using Docker:
```bash
docker-compose up -d
```
*This starts the database on port `5432` and the OSRM engine on port `5000`.*
*(Note: Docker Desktop must be open and running).*

---

### 3. Backend Setup & Run (FastAPI)
1. Open a new terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Set up and activate the virtual environment:
   ```bash
   # On Windows
   py -3.12 -m venv venv
   .\venv\Scripts\Activate.ps1

   # On Mac/Linux
   python3.12 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies and download the NLP package:
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```
4. Ensure you have your `.env` file set up (copy from `.env.example`).
5. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend server runs at `http://localhost:8000`.*

---

### 4. Frontend Setup & Run (Next.js)
1. Open a third terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies (if you haven't yet) and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
   *The interactive dashboard will be available at `http://localhost:3000`.*

---

### 📅 Your Daily Workflow
Since Step 1 is a one-time setup, your daily development routine is just:
1. Turn on background services: `docker-compose up -d`
2. Start the backend: `cd backend` -> Activate `venv` -> `uvicorn app.main:app --reload`
3. Start the frontend: `cd frontend` -> `npm run dev`

---

## 🛠️ Troubleshooting & Fallback
* **TypeError: Failed to fetch (Frontend):** Check that the backend server is running at `http://localhost:8000`.
* **Database Connection Warnings:** If PostgreSQL is offline, the backend logs a startup warning and operates in fallback mode, letting you test routing options using OSRM without crashing the server.
