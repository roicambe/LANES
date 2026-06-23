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

## ⚙️ Core System Concept & Routing Algorithm

The system operates strictly as a software-based solution, avoiding expensive IoT hardware or sensor grids by transforming digital community reports into active geospatial barriers across three computational phases:

```
[ Unstructured Text Ingestion ]
             │
             ▼
  (Phase 1: Bilingual NLP)  ──► Tokenize Taglish & classify depth severity
             │
             ▼
 (Phase 2: PostGIS Buffer)  ──► Geocode & calculate 50m bounding polygon
             │
             ▼
 (Phase 3: Route Rerouting) ──► Mark flood edge weights as infinity (∞) in OSRM
```

### Phase 1: Bilingual Ingestion & NLP Parsing
* RawTaglish strings (e.g., *“Baha sa may Caruncho Ave Pasig malapit sa mega market lagpas tuhod na raw”*) are scanned by a custom-trained **Named Entity Recognition (NER)** pipeline using **spaCy**.
* The parser isolates street-level location tokens (e.g. `Caruncho Ave`) and scans keywords for colloquial depth descriptions to automatically assign a flood severity tier.

### Phase 2: Geocoding & PostGIS Spatial Buffering
* Parsed street entities are geocoded into precise GPS coordinates `[longitude, latitude]`.
* Upon admin review and approval, the coordinate point is committed to the PostgreSQL database. The system executes a PostGIS spatial query (`ST_Buffer`) to expand the coordinate point into a **50-meter bounding polygon** covering the surrounding street width.

### Phase 3: Graph Network Routing & Cost Matrix Override
* The **Open Source Routing Machine (OSRM)** represents the Pasig City road network as a graph of nodes (intersections) and edges (streets).
* When a commuter requests a route, the backend checks for intersections between the baseline path and active flood polygons. If an intersection is found, OSRM sets the edge weights of the flooded streets to **infinity ($\infty$)**, forcing the engine to calculate a safe alternative detour.

---

## 📊 Standardized Flood Severity & Routing Scale

Flood alerts are classified into four standard safety thresholds based on vehicle clearing heights:

| Tier | Severity | Height Benchmark | Taglish Keywords | Routing Behavior |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ **White** | **Low / Passable** | `10cm` to `20cm` (Ankle-deep) | *basang-basa, bukton* | Passable. No detour required. |
| 🟨 **Yellow** | **Moderate** | `21cm` to `50cm` (Knee-deep) | *tuhod, hanggang-tuhod* | Warning issued. Passable for heavy vehicles. |
| 🟧 **Orange** | **High** | `51cm` to `140cm` (Waist/Chest) | *dibdib, kiwang, bewang* | **Hazardous. Path is blocked in OSRM.** |
| 🟥 **Red** | **Extreme** | Above `140cm` (Neck-deep / Submerged) | *leeg, lubog, lagpas-tao* | **Impassable. Path is blocked in OSRM.** |

---

## 📁 Project Directory Structure
* `/frontend`: Next.js application (using **MapLibre GL JS** and Tailwind CSS) representing the client maps and admin dashboards.
* `/backend`: FastAPI application (using Python, **spaCy**, **SQLAlchemy**, and **OSRM**) serving the API routes, spatial database, and NLP pipeline.

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
